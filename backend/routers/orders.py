"""
This module contains the router for handling orders.
It includes endpoints for creating orders, fetching orders, accepting orders,
transferring orders, retrieving specific orders, and completing orders.
Endpoints:
- POST /: Create a new order.
- GET /: Get all unaccepted orders.
- POST /{service}/{order_id}/accept: Accept an order.
- POST /{order_id}/transfer: Transfer an order to a new driver.
- GET /{order_id}: Retrieve a specific order by ID.
- POST /{service}/{order_id}/complete: Complete an order.
"""

from typing import List
import logging
from datetime import datetime
import json
import pytz
from backend.handlers.send_message import LineMessageService
from psycopg2.extensions import connection as Connection
from fastapi import APIRouter, HTTPException, Depends, Request
from backend.models.models import Order, DriverOrder, TransferOrderRequest, DetailedOrder, PendingTransfer, AcceptTransferRequest, CancelOrderRequest
from backend.database import get_db_connection
import os

# Taiwan timezone for timestamp conversion
TAIWAN_TZ = pytz.timezone('Asia/Taipei')

def format_timestamp(dt):
    """
    Convert a timezone-naive datetime to timezone-aware (Taiwan timezone) and return ISO format.
    Assumes PostgreSQL TIMESTAMP (without timezone) is stored in UTC, so we convert from UTC to Taiwan time.
    """
    if dt is None:
        return None
    if isinstance(dt, datetime):
        # If timezone-naive, assume it's stored in UTC (common PostgreSQL default)
        if dt.tzinfo is None:
            # Localize as UTC first, then convert to Taiwan timezone
            utc_dt = pytz.UTC.localize(dt)
            dt = utc_dt.astimezone(TAIWAN_TZ)
        # If already timezone-aware, convert to Taiwan timezone
        else:
            dt = dt.astimezone(TAIWAN_TZ)
        return dt.isoformat()
    return dt

line_service = LineMessageService()
router = APIRouter()

log_dir = os.path.join(os.getcwd(), 'backend', 'logs')

if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, 'orders.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler(log_file), logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

def log_event(event_type: str, data: dict):
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "data": data
    }
    logger.info(json.dumps(log_data))


def get_db():
    """
    Dependency function to get a database connection.
    """
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.post("/", response_model=Order)
async def create_order(order: DetailedOrder, conn: Connection = Depends(get_db), request: Request = None):
    """
    Create a new order.
    Args:
        order (DetailedOrder): The order data to be created.
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        Order: The created order with its ID.
    """
    logging.info("Order data received: %s", order.model_dump_json())
    cur = conn.cursor()
    try:
        # Validate total quantity of products (sum of all item quantities)
        MAX_PRODUCTS_PER_ORDER = 30
        total_quantity = sum(item.quantity for item in order.items)
        if total_quantity > MAX_PRODUCTS_PER_ORDER:
            log_event("ORDER_CREATION_FAILED", {
                "buyer_id": order.buyer_id,
                "total_quantity": total_quantity,
                "max_allowed": MAX_PRODUCTS_PER_ORDER,
                "reason": "Exceeds maximum products per order"
            })
            raise HTTPException(
                status_code=400, 
                detail=f"每筆訂單最多只能訂購 {MAX_PRODUCTS_PER_ORDER} 個商品。您目前訂購了 {total_quantity} 個商品，請減少數量。"
            )
        
        log_event("ORDER_CREATION_STARTED", {
            "buyer_id": order.buyer_id,
            "total_price": order.total_price,
            "is_urgent": order.is_urgent,
            "items_count": len(order.items),
            "total_quantity": total_quantity,
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })
            
        cur.execute(
            "INSERT INTO orders (buyer_id, buyer_name, buyer_phone, seller_id, seller_name, seller_phone, date, time, location, is_urgent, total_price, order_type, order_status, note, shipment_count, required_orders_count, previous_driver_id, previous_driver_name, previous_driver_phone) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (order.buyer_id, order.buyer_name, order.buyer_phone, order.seller_id, order.seller_name, order.seller_phone, order.date,
             order.time, order.location, order.is_urgent, order.total_price, order.order_type, order.order_status, order.note, order.shipment_count, order.required_orders_count, order.previous_driver_id,
             order.previous_driver_name, order.previous_driver_phone)
        )
        order_id = cur.fetchone()[0]
        for item in order.items:
            cur.execute(
                "INSERT INTO order_items (order_id, item_id, item_name, price, quantity, img, location, category) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (order_id, item.item_id, item.item_name, item.price, item.quantity, item.img, item.location, item.category)
            )
        conn.commit()
        order.id = order_id
        log_event("ORDER_CREATED", {
            "order_id": order_id,
            "buyer_id": order.buyer_id,
            "total_price": order.total_price,
            "status": "success"
        })
        return order
    except Exception as e:
        log_event("ORDER_CREATION_ERROR", {
            "error": str(e),
            "buyer_id": order.buyer_id
        })
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

@router.post("/cleanup-expired")
async def cleanup_expired_orders(conn: Connection = Depends(get_db)):
    """
    Mark orders older than 2 hours as expired.
    """
    cur = conn.cursor()
    try:
        # Mark orders as expired if they're older than 2 hours and still unaccepted
        cur.execute(
            """
            UPDATE orders 
            SET order_status = '已過期'
            WHERE order_status = '未接單' 
            AND timestamp < NOW() - INTERVAL '2 hours'
            RETURNING id, timestamp
            """
        )
        expired_orders = cur.fetchall()
        conn.commit()
        
        expired_count = len(expired_orders)
        if expired_count > 0:
            log_event("ORDERS_EXPIRED", {
                "expired_count": expired_count,
                "expired_order_ids": [order[0] for order in expired_orders]
            })
        
        return {
            "status": "success", 
            "expired_count": expired_count,
            "message": f"Marked {expired_count} orders as expired"
        }
    except Exception as e:
        conn.rollback()
        logging.error("Error cleaning up expired orders: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to cleanup expired orders") from e
    finally:
        cur.close()

@router.post("/handle-expired/{order_id}")
async def handle_expired_order(
    order_id: int, 
    action: str,  # 'return_to_seller', 'dispose', 'donate'
    reason: str = "",
    conn: Connection = Depends(get_db)
):
    """
    Handle expired products - what driver should do with them.
    """
    cur = conn.cursor()
    try:
        # Validate the action
        valid_actions = ['return_to_seller', 'dispose', 'donate', 'customer_still_wants']
        if action not in valid_actions:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        # Update order status based on action
        status_mapping = {
            'return_to_seller': '已退回賣家',
            'dispose': '已丟棄',
            'donate': '已捐贈',
            'customer_still_wants': '已完成'
        }
        
        new_status = status_mapping[action]
        
        cur.execute(
            """
            UPDATE orders 
            SET order_status = %s, note = CONCAT(COALESCE(note, ''), ' [過期處理: ', %s, ' - ', %s, ']')
            WHERE id = %s
            RETURNING buyer_id, total_price
            """,
            (new_status, action, reason, order_id)
        )
        
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")
        
        buyer_id, total_price = result
        
        # If disposing or donating, process refund
        if action in ['dispose', 'donate']:
            # Here you could integrate with payment system for refunds
            log_event("REFUND_PROCESSED", {
                "order_id": order_id,
                "buyer_id": buyer_id,
                "amount": total_price,
                "reason": f"Product expired - {action}"
            })
        
        conn.commit()
        
        log_event("EXPIRED_ORDER_HANDLED", {
            "order_id": order_id,
            "action": action,
            "reason": reason,
            "new_status": new_status
        })
        
        return {
            "status": "success",
            "message": f"Order {order_id} handled: {action}",
            "new_status": new_status
        }
        
    except HTTPException as he:
        conn.rollback()
        raise he
    except Exception as e:
        conn.rollback()
        logging.error("Error handling expired order: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to handle expired order") from e
    finally:
        cur.close()

@router.post("/{service}/{order_id}/pickup")
async def confirm_pickup(service: str, order_id: int, conn: Connection = Depends(get_db)):
    """
    Confirm that driver has picked up the order and update status to '配送中'.
    """
    cur = conn.cursor()
    try:
        # Update order status to indicate pickup confirmed
        cur.execute(
            """
            UPDATE orders 
            SET order_status = '配送中'
            WHERE id = %s AND order_status = '接單'
            RETURNING id, buyer_name
            """,
            (order_id,)
        )
        
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Order not found or not in correct status")
        
        conn.commit()
        
        log_event("ORDER_PICKUP_CONFIRMED", {
            "order_id": order_id,
            "service": service,
            "status": "配送中"
        })
        
        return {
            "status": "success",
            "message": f"Order {order_id} pickup confirmed - now in delivery",
            "new_status": "配送中"
        }
        
    except HTTPException as he:
        conn.rollback()
        raise he
    except Exception as e:
        conn.rollback()
        logging.error("Error confirming pickup: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to confirm pickup") from e
    finally:
        cur.close()

@router.get("/", response_model=List[Order])
async def get_orders(conn: Connection = Depends(get_db), request: Request = None):
    """
    Get all unaccepted orders.
    Args:
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        List[Order]: A list of unaccepted orders.
    """
    cur = conn.cursor()
    try:
        log_event("FETCH_ORDERS_STARTED", {
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })
        
        # First, automatically mark expired orders
        # For unaccepted orders - mark as expired
        cur.execute(
            """
            UPDATE orders 
            SET order_status = '已過期'
            WHERE order_status = '未接單' 
            AND timestamp < NOW() - INTERVAL '2 hours'
            """
        )
        expired_count = cur.rowcount
        
        # For accepted orders - mark as needing driver action if expired during delivery
        cur.execute(
            """
            UPDATE orders 
            SET order_status = '配送逾時'
            WHERE order_status = '接單' 
            AND timestamp < NOW() - INTERVAL '4 hours'
            """
        )
        expired_count += cur.rowcount
        
        # Mark expired agricultural_product orders
        cur.execute(
            """
            UPDATE agricultural_product_order 
            SET status = '已過期'
            WHERE status = '未接單' 
            AND timestamp < NOW() - INTERVAL '2 hours'
            """
        )
        expired_count += cur.rowcount
        
        if expired_count > 0:
            conn.commit()
            log_event("AUTO_EXPIRED_ORDERS", {
                "expired_count": expired_count,
                "during": "fetch_orders"
            })
        
        # Then fetch all unaccepted orders (excluding expired ones for drivers)
        cur.execute("""
            SELECT id, buyer_id, buyer_name, buyer_phone, location, is_urgent, total_price, 
                order_type, order_status, note, timestamp
            FROM orders
            WHERE order_status = '未接單'
        """)
        orders = cur.fetchall()
        order_list = []
        for order in orders:
            cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order[0],))
            items = cur.fetchall()
            order_list.append({
                "id": order[0],
                "buyer_id": order[1],
                "buyer_name": order[2], 
                "buyer_phone": order[3], 
                "location": order[4],
                "is_urgent": bool(order[5]),  
                "total_price": float(order[6]),  
                "order_type": order[7],
                "order_status": order[8],
                "note": order[9],
                "timestamp": format_timestamp(order[10]),
                "service":'necessities',
                "items": [{
                    #"order_id": item[1], 
                    "item_id": item[2], 
                    "item_name": item[3], 
                    "price": float(item[4]), 
                    "quantity": int(item[5]), 
                    "img": str(item[6]), 
                    "location": str(item[7]),
                    "category":str(item[8])} for item in items]  
            })
        # Add agricultural_product orders (only unaccepted ones)
        cur.execute("""
            SELECT agri_p_o.id, agri_p_o.buyer_id, agri_p_o.buyer_name, agri_p_o.buyer_phone, agri_p_o.end_point, agri_p_o.status, agri_p_o.note, 
                    agri_p.id, agri_p.name, agri_p.price, agri_p_o.quantity, agri_p.img_link, agri_p_o.starting_point, agri_p.category, agri_p_o.is_put,agri_p_o.timestamp
            FROM agricultural_product_order as agri_p_o
            JOIN agricultural_produce as agri_p ON agri_p.id = agri_p_o.produce_id
            WHERE agri_p_o.status = '未接單'
        """)
        agri_orders = cur.fetchall()
        for agri_order in agri_orders:
            try:
                total_price = agri_order[9] * agri_order[10] #price*quantity
            except (ValueError, TypeError) as ve:
                logging.error(f"Invalid price or quantity for agricultural order {agri_order[0]}: {agri_order[9]}, {agri_order[10]}")
                raise HTTPException(status_code=500, detail="Invalid price or quantity data.")
            
            agri_order_dict = {
                "id": agri_order[0],
                "buyer_id": agri_order[1],
                "buyer_name": agri_order[2],
                "buyer_phone": agri_order[3],
                "location":agri_order[4], #商品要送達的目的地
                "is_urgent": False, 
                "total_price": total_price,
                "order_type": '購買類',
                "order_status": agri_order[5], #未接單、已接單、已送達
                "note": agri_order[6],
                "service":'agricultural_product',
                "items": [{
                    "item_id": str(agri_order[7]),
                    "item_name": agri_order[8],
                    "price": agri_order[9],
                    "quantity": agri_order[10],
                    "img": agri_order[11],
                    "location": agri_order[12], #司機拿取農產品的地方
                    "category": agri_order[13]
                }],
                "is_put": agri_order[14],
                "timestamp": format_timestamp(agri_order[15])

            }
            order_list.append(agri_order_dict)
        log_event("FETCH_ORDERS_SUCCESS", {
            "total_orders": len(order_list)
        })
        return order_list
    except Exception as e:
        logging.error("Error fetching orders: %s", str(e))
        log_event("FETCH_ORDERS_ERROR", {
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

@router.get("/seller/{seller_id}")
async def get_orders_by_seller(seller_id: int, conn: Connection = Depends(get_db), request: Request = None):
    """
    Get all orders for a specific seller.
    Args:
        seller_id (int): The ID of the seller.
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        List[dict]: A list of orders for the seller.
    """
    cur = conn.cursor()
    try:
        log_event("FETCH_SELLER_ORDERS_STARTED", {
            "seller_id": seller_id,
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })

        # Check if seller exists
        cur.execute("SELECT id, name FROM users WHERE id = %s", (seller_id,))
        seller = cur.fetchone()
        if not seller:
            raise HTTPException(status_code=404, detail="賣家不存在")

        order_list = []

        # Fetch regular orders for this seller
        cur.execute("""
            SELECT id, buyer_name, buyer_phone, order_status, date, time, location, total_price, order_type
            FROM orders 
            WHERE seller_id = %s
            ORDER BY date DESC, time DESC
        """, (seller_id,))
        regular_orders = cur.fetchall()

        for order in regular_orders:
            order_dict = {
                "id": str(order[0]),  # Convert to string for consistency
                "customer_name": order[1],  # buyer_name
                "customer_phone": order[2],  # buyer_phone
                "product_name": "生活必需品",  # Default for regular orders
                "quantity": 1,  # Default quantity
                "total_price": order[7],  # total_price
                "status": order[3],  # order_status
                "order_date": order[4].isoformat() if order[4] else "",  # date
                "delivery_date": order[4].isoformat() if order[4] else "",  # Same as order date
                "location": order[6],  # location
                "order_type": order[8]  # order_type
            }
            order_list.append(order_dict)

        # Fetch agricultural product orders for this seller
        cur.execute("""
            SELECT apo.id, apo.buyer_name, apo.buyer_phone, apo.status, apo.timestamp, 
                   apo.starting_point, apo.end_point, apo.quantity, p.name as product_name, p.price,
                   p.img_link, p.category
            FROM agricultural_product_order apo
            LEFT JOIN agricultural_produce p ON apo.produce_id = p.id
            WHERE apo.seller_id = %s
            ORDER BY apo.timestamp DESC
        """, (seller_id,))
        agri_orders = cur.fetchall()

        for agri_order in agri_orders:
            order_dict = {
                "id": f"agri_{agri_order[0]}",  # Prefix to make it unique
                "customer_name": agri_order[1],  # buyer_name
                "customer_phone": agri_order[2],  # buyer_phone
                "product_name": agri_order[8] or "農產品",  # product_name
                "quantity": agri_order[7],  # quantity
                "total_price": (agri_order[9] or 0) * agri_order[7],  # price * quantity
                "status": agri_order[3],  # status
                "order_date": agri_order[4].isoformat() if agri_order[4] else "",  # timestamp
                "delivery_date": agri_order[4].isoformat() if agri_order[4] else "",  # Same as order date
                "location": agri_order[6],  # end_point
                "order_type": "agricultural_product",
                "img_link": agri_order[10],  # product image
                "category": agri_order[11]   # product category
            }
            order_list.append(order_dict)

        log_event("FETCH_SELLER_ORDERS_SUCCESS", {
            "seller_id": seller_id,
            "total_orders": len(order_list)
        })
        return order_list

    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error("Error fetching seller orders: %s", str(e))
        log_event("FETCH_SELLER_ORDERS_ERROR", {
            "seller_id": seller_id,
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

@router.patch("/{order_id}")
async def update_order_status(order_id: str, status_update: dict, conn: Connection = Depends(get_db), request: Request = None):
    """
    Update the status of an order.
    Args:
        order_id (str): The ID of the order to update (can be regular ID or agri_ prefixed).
        status_update (dict): The status update data.
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        dict: A success message.
    """
    cur = conn.cursor()
    try:
        log_event("UPDATE_ORDER_STATUS_STARTED", {
            "order_id": order_id,
            "status_update": status_update,
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })

        # Check if it's an agricultural product order (starts with 'agri_')
        if str(order_id).startswith('agri_'):
            agri_order_id = str(order_id).replace('agri_', '')
            cur.execute("SELECT id, status FROM agricultural_product_order WHERE id = %s", (agri_order_id,))
            order = cur.fetchone()
            
            if not order:
                raise HTTPException(status_code=404, detail="農產品訂單不存在")
            
            new_status = status_update.get("order_status")
            if not new_status:
                raise HTTPException(status_code=400, detail="缺少訂單狀態")
            
            cur.execute(
                "UPDATE agricultural_product_order SET status = %s WHERE id = %s",
                (new_status, agri_order_id)
            )
        else:
            # Handle regular order
            cur.execute("SELECT id, order_status FROM orders WHERE id = %s", (order_id,))
            order = cur.fetchone()
            
            if not order:
                raise HTTPException(status_code=404, detail="訂單不存在")
            
            new_status = status_update.get("order_status")
            if not new_status:
                raise HTTPException(status_code=400, detail="缺少訂單狀態")
            
            cur.execute(
                "UPDATE orders SET order_status = %s WHERE id = %s",
                (new_status, order_id)
            )

        conn.commit()
        
        log_event("UPDATE_ORDER_STATUS_SUCCESS", {
            "order_id": order_id,
            "new_status": new_status
        })
        
        return {"message": "訂單狀態更新成功", "order_id": order_id, "new_status": new_status}

    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error("Error updating order status: %s", str(e))
        log_event("UPDATE_ORDER_STATUS_ERROR", {
            "order_id": order_id,
            "error": str(e)
        })
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

@router.post("/{service}/{order_id}/accept")
async def accept_order(service: str, order_id: int, driver_order: DriverOrder, conn: Connection = Depends(get_db), request: Request = None):
    """
    Accept an order.
    Args:
        service (str): The service type ('necessities' or 'agricultural_product').
        order_id (int): The ID of the order to be accepted.
        driver_order (DriverOrder): The driver order data.
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        dict: A success message.
    """
    logging.info("Received driver_order: %s", driver_order.model_dump_json())
    cur = conn.cursor()
    try:
        
        log_event("ORDER_ACCEPTANCE_STARTED", {
            "order_id": order_id,
            "driver_id": driver_order.driver_id,
            "service": service,
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })

        # Get driver's user_id to check if driver is the same person who placed the order
        cur.execute("SELECT user_id FROM drivers WHERE id = %s", (driver_order.driver_id,))
        driver_user_result = cur.fetchone()
        if not driver_user_result:
            raise HTTPException(status_code=404, detail="司機不存在")
        driver_user_id = driver_user_result[0]

        # Check if driver has overdue orders (more than 2 hours since acceptance and not completed)
        cur.execute("""
            SELECT COUNT(*) 
            FROM driver_orders dro
            LEFT JOIN orders o ON dro.order_id = o.id AND dro.service = 'necessities'
            LEFT JOIN agricultural_product_order apo ON dro.order_id = apo.id AND dro.service = 'agricultural_product'
            WHERE dro.driver_id = %s 
              AND dro.action = '接單'
              AND dro.timestamp < NOW() - INTERVAL '2 hours'
              AND (
                (dro.service = 'necessities' AND o.order_status NOT IN ('已送達', '已完成'))
                OR (dro.service = 'agricultural_product' AND apo.status NOT IN ('已送達'))
              )
        """, (driver_order.driver_id,))
        overdue_count = cur.fetchone()[0]
        if overdue_count > 0:
            raise HTTPException(
                status_code=403, 
                detail=f"您有 {overdue_count} 筆訂單超過 2 小時未完成配送，請先完成已接受的訂單後再接受新訂單"
            )

        if service == 'necessities':
            # Get order details with items
            cur.execute("""
                SELECT o.id, o.buyer_id, o.buyer_name, o.buyer_phone, o.location, 
                       o.is_urgent, o.total_price, o.order_type, o.order_status, 
                       o.note, o.timestamp,
                       oi.item_name, oi.quantity, oi.price,
                       d.driver_phone as driver_phone
                FROM orders o 
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN drivers d ON d.id = %s
                WHERE o.id = %s
                FOR UPDATE OF o
            """, (driver_order.driver_id, order_id))
            order_data = cur.fetchall()

            if not order_data:
                raise HTTPException(status_code=404, detail="訂單未找到")

            order = order_data[0]
            if order[8] != '未接單':  # order_status index
                raise HTTPException(status_code=400, detail="訂單已被接")
            
            # Check if order has expired (older than 2 hours)
            if order[10]:  # timestamp index
                cur.execute("""
                    SELECT NOW() - %s > INTERVAL '2 hours'
                """, (order[10],))
                is_expired = cur.fetchone()[0]
                if is_expired:
                    # Mark order as expired
                    cur.execute("UPDATE orders SET order_status = %s WHERE id = %s", ('已過期', order_id))
                    conn.commit()
                    raise HTTPException(status_code=400, detail="訂單已過期，無法接單")

            # Format message with order details
            buyer_id = order[1]  # buyer_id index
            
            # Check if driver is trying to accept their own order
            if driver_user_id == buyer_id:
                raise HTTPException(status_code=400, detail="無法接取自己的訂單")
            total_price = float(order[6])  # total_price index
            delivery_address = order[4]  # location index
            driver_phone = order[-1] if order[-1] else "無"

            message = "司機已接取您的商品，請等待司機送貨👍🏻\n\n"
            message += "📦 訂單明細 #" + str(order_id) + "\n"
            message += f"📍 送貨地點：{delivery_address}\n"
            message += f"📱 司機電話：{driver_phone}\n"
            message += "─────────────\n"

            for item in order_data:
                item_name = item[11]  # item_name from join
                quantity = int(item[12])  # quantity from join
                price = float(item[13])  # price from join
                subtotal = quantity * price
                message += f"・{item_name}\n"
                message += f"  ${price} x {quantity} = ${subtotal}\n"

            message += "─────────────\n"
            message += f"總計: ${total_price}"

            # Send notification to buyer
            success = await line_service.send_message_to_user(buyer_id, message)
            if not success:
                logger.warning(f"買家 (ID: {buyer_id}) 未綁定 LINE 帳號或發送通知失敗")

            # Update order status
            cur.execute("UPDATE orders SET order_status = %s WHERE id = %s", ('接單', order_id))

        elif service == 'agricultural_product':
            # Get order details with items
            cur.execute("""
                SELECT o.id, o.buyer_id, o.buyer_name, o.buyer_phone, o.end_point,
                       o.status, o.note, 
                       p.id, p.name, p.price, o.quantity,
                       p.img_link, o.starting_point, p.category, o.is_put, o.timestamp,
                       d.driver_phone as driver_phone
                FROM agricultural_product_order o 
                LEFT JOIN agricultural_produce p ON p.id = o.produce_id
                LEFT JOIN drivers d ON d.id = %s
                WHERE o.id = %s 
                FOR UPDATE OF o
            """, (driver_order.driver_id, order_id))
            order_data = cur.fetchall()

            if not order_data:
                raise HTTPException(status_code=404, detail="訂單未找到")

            order = order_data[0]
            if order[5] != '未接單':  # status index
                raise HTTPException(status_code=400, detail="訂單已被接")
            
            # Check if order has expired (older than 2 hours)
            if order[15]:  # timestamp index
                cur.execute("""
                    SELECT NOW() - %s > INTERVAL '2 hours'
                """, (order[15],))
                is_expired = cur.fetchone()[0]
                if is_expired:
                    # Mark order as expired
                    cur.execute("UPDATE agricultural_product_order SET status = %s WHERE id = %s", ('已過期', order_id))
                    conn.commit()
                    raise HTTPException(status_code=400, detail="訂單已過期，無法接單")

            # Format message with order details
            buyer_id = order[1]
            
            # Check if driver is trying to accept their own order
            if driver_user_id == buyer_id:
                raise HTTPException(status_code=400, detail="無法接取自己的訂單")
            price = float(order[9])  # price from agricultural_produce
            quantity = int(order[10])  # quantity from order
            total_price = price * quantity
            delivery_address = order[4]  # end_point
            driver_phone = order[16] if order[16] else "無"


            message = "司機已接取您的農產品，請等待司機送貨👍🏻\n\n"
            message += "📦 訂單明細 #" + str(order_id) + "\n"
            message += f"📍 送貨地點：{delivery_address}\n"
            message += f"📱 司機電話：{driver_phone}\n"
            message += "─────────────\n"

            
            # Process items from order_data
            item_name = order[8]  # 商品名稱 (p.name)
            message += f"・{item_name}\n"
            message += f"  ${price} x {quantity} = ${total_price}\n"
            message += "─────────────\n"

            message += f"總計: ${total_price} 元"


            # Send notification to buyer
            success = await line_service.send_message_to_user(buyer_id, message)
            if not success:
                logger.warning(f"買家 (ID: {buyer_id}) 未綁定 LINE 帳號或發送通知失敗")

            # Update order status
            cur.execute("UPDATE agricultural_product_order SET status = %s WHERE id = %s", ('接單', order_id))

        # Insert driver_orders record
        cur.execute(
            "INSERT INTO driver_orders (driver_id, order_id, action, timestamp, previous_driver_id, previous_driver_name, previous_driver_phone, service) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (driver_order.driver_id, order_id, '接單', driver_order.timestamp, driver_order.previous_driver_id, 
             driver_order.previous_driver_name, driver_order.previous_driver_phone, driver_order.service)
        )

        conn.commit()
        log_event("ORDER_ACCEPTED", {
            "order_id": order_id,
            "driver_id": driver_order.driver_id,
            "service": service,
            "status": "success"
        })
        return {"status": "success", "message": f"訂單 {order_id} 已成功被接受"}

    except HTTPException as e:
        conn.rollback()
        if e.status_code == 400:
            logging.error("訂單已被接")
            log_event("ORDER_ACCEPTANCE_FAILED", {
                "order_id": order_id,
                "driver_id": driver_order.driver_id,
                "service": service,
                "reason": "訂單已被接"
            })
        elif e.status_code == 404:
            logging.error("訂單未找到")
            log_event("ORDER_ACCEPTANCE_FAILED", {
                "order_id": order_id,
                "driver_id": driver_order.driver_id,
                "service": service,
                "reason": "訂單未找到"
            })
        raise e
    except Exception as e:
        conn.rollback()
        log_event("ORDER_ACCEPTANCE_ERROR", {
            "order_id": order_id,
            "driver_id": driver_order.driver_id,
            "service": service,
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試") from e
    finally:
        cur.close()


@router.post("/{order_id}/transfer")
async def transfer_order(order_id: int, transfer_request: TransferOrderRequest, conn: Connection = Depends(get_db), request: Request = None):
    """
    Transfer an order to a new driver.
    Args:
        order_id (int): The ID of the order to be transferred.
        transfer_request (TransferOrderRequest): The transfer request data.
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        dict: A success message.
    """
    cur = conn.cursor()
    try:

        log_event("ORDER_TRANSFER_STARTED", {
            "order_id": order_id,
            "current_driver_id": transfer_request.current_driver_id,
            "new_driver_phone": transfer_request.new_driver_phone,
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })

        # Get current driver details
        cur.execute(
            "SELECT driver_name, driver_phone FROM drivers WHERE id = %s",
            (transfer_request.current_driver_id,)
        )
        current_driver = cur.fetchone()
        if not current_driver:
            raise HTTPException(status_code=404, detail="找不到原始司機資訊")
        
        current_driver_name = current_driver[0]
        current_driver_phone = current_driver[1]

        
        # Find new driver by phone
        cur.execute("SELECT id, user_id, driver_name, driver_phone FROM drivers WHERE driver_phone = %s", (transfer_request.new_driver_phone,))
        new_driver = cur.fetchone()

        if not new_driver:
            raise HTTPException(status_code=404, detail="新司機未註冊")
        new_driver_id = new_driver[0]

        if new_driver_id == transfer_request.current_driver_id:
            raise HTTPException(status_code=400, detail="不能將訂單轉給自己")

        # Ensure current driver is assigned to the order and get service type
        cur.execute("SELECT driver_id, service FROM driver_orders WHERE order_id = %s AND action = '接單' FOR UPDATE", (order_id,))
        order_record = cur.fetchone()
        if not order_record or order_record[0] != transfer_request.current_driver_id:
            raise HTTPException(status_code=400, detail="當前司機無法轉交此訂單")
        
        service_type = order_record[1] if order_record[1] else 'necessities'  # Default to necessities if not specified

        # Check if there's already a pending transfer for this order and new driver
        cur.execute(
            "SELECT id FROM pending_transfers WHERE order_id = %s AND new_driver_id = %s AND status = 'pending'",
            (order_id, new_driver_id)
        )
        existing_pending = cur.fetchone()
        if existing_pending:
            raise HTTPException(status_code=400, detail="該轉單請求已存在，請等待新司機回應")

        # Create pending transfer instead of immediately transferring
        cur.execute(
            """INSERT INTO pending_transfers 
            (order_id, current_driver_id, new_driver_id, current_driver_name, current_driver_phone, service, status, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', CURRENT_TIMESTAMP + INTERVAL '24 hours')
            RETURNING id""",
            (order_id, transfer_request.current_driver_id, new_driver_id, current_driver_name, current_driver_phone, service_type)
        )
        pending_transfer_id = cur.fetchone()[0]

        # Send notification to new driver about pending transfer
        notification_message = (
            f"您有一筆新的轉單請求待確認 (訂單編號: {order_id})\n"
            f"轉單來自司機: {current_driver_name}\n"
            f"聯絡電話: {current_driver_phone}\n"
            f"請至司機專區查看並決定是否接受此轉單"
        )
        
        success = await line_service.send_message_to_user(
            new_driver[1],  # new_driver[1]=user_id
            notification_message
        )
        if not success:
            logging.warning(f"司機 (ID: {new_driver[1]}) 未綁定 LINE 帳號或發送通知失敗")

        conn.commit()
        return {
            "status": "pending", 
            "message": "轉單請求已送出，等待新司機確認",
            "pending_transfer_id": pending_transfer_id
        }
    except HTTPException as e:
        conn.rollback()
        if e.status_code == 400:
            logging.error("當前司機無法轉交此訂單")
            log_event("ORDER_TRANSFER_FAILED", {
                "order_id": order_id,
                "current_driver_id": transfer_request.current_driver_id,
                "new_driver_phone": transfer_request.new_driver_phone,
                "reason": "當前司機無法轉交此訂單"
            })
        elif e.status_code == 404:
            logging.error("司機資訊未找到")
            log_event("ORDER_TRANSFER_FAILED", {
                "order_id": order_id,
                "current_driver_id": transfer_request.current_driver_id,
                "new_driver_phone": transfer_request.new_driver_phone,
                "reason": "司機資訊未找到"
            })
        raise e
    except Exception as e:
        conn.rollback()
        log_event("ORDER_TRANSFER_ERROR", {
            "order_id": order_id,
            "current_driver_id": transfer_request.current_driver_id,
            "new_driver_phone": transfer_request.new_driver_phone,
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

@router.get("/pending-transfers/{driver_id}")
async def get_pending_transfers(driver_id: int, conn: Connection = Depends(get_db)):
    """
    Get all pending transfer requests for a driver.
    Args:
        driver_id: The ID of the driver to get pending transfers for.
        conn: The database connection.
    Returns:
        List of pending transfer requests.
    """
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT pt.id, pt.order_id, pt.current_driver_id, pt.current_driver_name, 
                   pt.current_driver_phone, pt.service, pt.status, pt.created_at, pt.expires_at
            FROM pending_transfers pt
            WHERE pt.new_driver_id = %s AND pt.status = 'pending' 
            AND pt.expires_at > CURRENT_TIMESTAMP
            ORDER BY pt.created_at DESC
        """, (driver_id,))
        
        pending_transfers = cur.fetchall()
        result = []
        for pt in pending_transfers:
            result.append({
                "id": pt[0],
                "order_id": pt[1],
                "current_driver_id": pt[2],
                "current_driver_name": pt[3],
                "current_driver_phone": pt[4],
                "service": pt[5],
                "status": pt[6],
                "created_at": format_timestamp(pt[7]),
                "expires_at": format_timestamp(pt[8])
            })
        return result
    except Exception as e:
        logging.error("Error fetching pending transfers: %s", str(e))
        raise HTTPException(status_code=500, detail="獲取待處理轉單失敗") from e
    finally:
        cur.close()

@router.post("/pending-transfers/{transfer_id}/accept")
async def accept_pending_transfer(transfer_id: int, accept_request: AcceptTransferRequest, conn: Connection = Depends(get_db)):
    """
    Accept a pending transfer request.
    Args:
        transfer_id: The ID of the pending transfer.
        accept_request: The accept request containing driver_id.
        conn: The database connection.
    Returns:
        Success message.
    """
    cur = conn.cursor()
    try:
        # Get pending transfer details
        cur.execute("""
            SELECT pt.order_id, pt.current_driver_id, pt.new_driver_id, pt.current_driver_name, 
                   pt.current_driver_phone, pt.service, pt.status
            FROM pending_transfers pt
            WHERE pt.id = %s AND pt.status = 'pending' AND pt.expires_at > CURRENT_TIMESTAMP
        """, (transfer_id,))
        
        pending_transfer = cur.fetchone()
        if not pending_transfer:
            raise HTTPException(status_code=404, detail="轉單請求不存在或已過期")
        
        order_id = pending_transfer[0]
        current_driver_id = pending_transfer[1]
        new_driver_id = pending_transfer[2]
        current_driver_name = pending_transfer[3]
        current_driver_phone = pending_transfer[4]
        service_type = pending_transfer[5]
        
        # Verify the driver accepting is the new driver
        if new_driver_id != accept_request.driver_id:
            raise HTTPException(status_code=403, detail="無權限接受此轉單請求")
        
        # Verify current driver still owns the order
        cur.execute("SELECT driver_id FROM driver_orders WHERE order_id = %s AND action = '接單' FOR UPDATE", (order_id,))
        order_record = cur.fetchone()
        if not order_record or order_record[0] != current_driver_id:
            # Update pending transfer status to expired
            cur.execute("UPDATE pending_transfers SET status = 'expired' WHERE id = %s", (transfer_id,))
            conn.commit()
            raise HTTPException(status_code=400, detail="原始司機已不再擁有此訂單，轉單請求已失效")
        
        # Update driver_orders with new driver details
        cur.execute(
            "UPDATE driver_orders SET driver_id = %s, previous_driver_id = %s, previous_driver_name = %s, "
            "previous_driver_phone = %s WHERE order_id = %s AND driver_id = %s AND action = '接單'", 
            (new_driver_id, current_driver_id, current_driver_name, current_driver_phone, order_id, current_driver_id)
        )
        
        # Update pending_transfers status to accepted
        cur.execute("UPDATE pending_transfers SET status = 'accepted' WHERE id = %s", (transfer_id,))
        
        # Mark any other pending transfers for this order as expired
        cur.execute(
            "UPDATE pending_transfers SET status = 'expired' WHERE order_id = %s AND id != %s AND status = 'pending'",
            (order_id, transfer_id)
        )
        
        conn.commit()
        
        log_event("ORDER_TRANSFER_ACCEPTED", {
            "transfer_id": transfer_id,
            "order_id": order_id,
            "current_driver_id": current_driver_id,
            "new_driver_id": new_driver_id
        })
        
        return {"status": "success", "message": "轉單已成功接受，訂單已轉移給您"}
        
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logging.error("Error accepting pending transfer: %s", str(e))
        raise HTTPException(status_code=500, detail="接受轉單失敗") from e
    finally:
        cur.close()

@router.post("/pending-transfers/{transfer_id}/reject")
async def reject_pending_transfer(transfer_id: int, reject_request: AcceptTransferRequest, conn: Connection = Depends(get_db)):
    """
    Reject a pending transfer request.
    Args:
        transfer_id: The ID of the pending transfer.
        reject_request: The reject request containing driver_id.
        conn: The database connection.
    Returns:
        Success message.
    """
    cur = conn.cursor()
    try:
        # Get pending transfer details
        cur.execute("""
            SELECT pt.new_driver_id, pt.status
            FROM pending_transfers pt
            WHERE pt.id = %s AND pt.status = 'pending'
        """, (transfer_id,))
        
        pending_transfer = cur.fetchone()
        if not pending_transfer:
            raise HTTPException(status_code=404, detail="轉單請求不存在")
        
        new_driver_id = pending_transfer[0]
        
        # Verify the driver rejecting is the new driver
        if new_driver_id != reject_request.driver_id:
            raise HTTPException(status_code=403, detail="無權限拒絕此轉單請求")
        
        # Update pending_transfers status to rejected
        cur.execute("UPDATE pending_transfers SET status = 'rejected' WHERE id = %s", (transfer_id,))
        conn.commit()
        
        log_event("ORDER_TRANSFER_REJECTED", {
            "transfer_id": transfer_id,
            "driver_id": new_driver_id
        })
        
        return {"status": "success", "message": "轉單請求已拒絕"}
        
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logging.error("Error rejecting pending transfer: %s", str(e))
        raise HTTPException(status_code=500, detail="拒絕轉單失敗") from e
    finally:
        cur.close()

@router.get("/{order_id}")
async def get_order(order_id: int, conn: Connection = Depends(get_db), request: Request = None):
    """
    Get a specific order by ID.
    Args:
        order_id (int): The ID of the order to retrieve.
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        dict: The order data.
    """
    cur = conn.cursor()
    try:
        log_event("FETCH_ORDER_STARTED", {
            "order_id": order_id,
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })
        
        # First, check if this order was accepted by a driver and determine service type
        cur.execute("SELECT service FROM driver_orders WHERE order_id = %s LIMIT 1", (order_id,))
        service_result = cur.fetchone()
        service_type = service_result[0] if service_result else None
        
        order_data = None
        
        if service_type == "agricultural_product":
            # This is an agricultural product order
            cur.execute("""
                SELECT agri_p_o.id, agri_p_o.buyer_id, agri_p_o.buyer_name, agri_p_o.buyer_phone, 
                       agri_p_o.end_point, agri_p_o.status, agri_p_o.note, agri_p_o.timestamp,
                       agri_p.id, agri_p.name, agri_p.price, agri_p_o.quantity, agri_p.img_link, 
                       agri_p_o.starting_point, agri_p.category
                FROM agricultural_product_order as agri_p_o
                JOIN agricultural_produce as agri_p on agri_p.id = agri_p_o.produce_id
                WHERE agri_p_o.id = %s
            """, (order_id,))
            
            agri_order = cur.fetchone()
            if agri_order:
                # Calculate total price for agricultural product
                total_price = agri_order[10] * agri_order[11]  # price * quantity
                
                order_data = {
                    "id": agri_order[0],
                    "buyer_id": agri_order[1],
                    "buyer_name": agri_order[2],
                    "buyer_phone": agri_order[3],
                    "location": agri_order[4],  # end_point (delivery location)
                    "is_urgent": False,
                    "total_price": float(total_price),
                    "order_type": "購買類",
                    "order_status": agri_order[5],
                    "note": agri_order[6] or "",
                    "service": "agricultural_product",
                    "timestamp": agri_order[7],
                    "items": [{
                        "item_id": agri_order[8],
                        "item_name": agri_order[9],
                        "price": float(agri_order[10]),
                        "quantity": int(agri_order[11]),
                        "img": agri_order[12],
                        "location": agri_order[13],  # starting_point (pickup location)
                        "category": agri_order[14]
                    }]
                }
        
        elif service_type == "necessities" or service_type is None:
            # This is a necessities order or unaccepted order, check orders table
            cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
            order = cur.fetchone()
            
            if order:
                cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
                items = cur.fetchall()

                order_data = {
                    "id": order[0],
                    "buyer_id": order[1],
                    "buyer_name": order[2],  # str
                    "buyer_phone": order[3],  # str
                    "seller_id": int(order[4]),  # int
                    "seller_name": order[5],  # str
                    "seller_phone": order[6],  # str
                    "date": order[7].isoformat(),  # str
                    "time": order[8].isoformat(),  # str
                    "location": order[9],
                    "is_urgent": bool(order[10]),  # bool
                    "total_price": float(order[11]),  # float
                    "order_type": order[12],
                    "order_status": order[13],
                    "note": order[14],
                    "shipment_count": order[15],
                    "required_orders_count": order[16],
                    "previous_driver_id": order[17],
                    "previous_driver_name": order[18],
                    "previous_driver_phone": order[19],
                    "service": "necessities",
                    "items": [{"order_id": item[1], "item_id": item[2], "item_name": item[3], "price": float(item[4]), "quantity": int(item[5]), 
                               "img": str(item[6]),"location": str(item[7]),"category":str(item[8])} for item in items]
                }
            else:
                # If not in orders table, try agricultural_product_order as fallback
                cur.execute("""
                    SELECT agri_p_o.id, agri_p_o.buyer_id, agri_p_o.buyer_name, agri_p_o.buyer_phone, 
                           agri_p_o.end_point, agri_p_o.status, agri_p_o.note, agri_p_o.timestamp,
                           agri_p.id, agri_p.name, agri_p.price, agri_p_o.quantity, agri_p.img_link, 
                           agri_p_o.starting_point, agri_p.category
                    FROM agricultural_product_order as agri_p_o
                    JOIN agricultural_produce as agri_p on agri_p.id = agri_p_o.produce_id
                    WHERE agri_p_o.id = %s
                """, (order_id,))
                
                agri_order = cur.fetchone()
                if agri_order:
                    # Calculate total price for agricultural product
                    total_price = agri_order[10] * agri_order[11]  # price * quantity
                    
                    order_data = {
                        "id": agri_order[0],
                        "buyer_id": agri_order[1],
                        "buyer_name": agri_order[2],
                        "buyer_phone": agri_order[3],
                        "location": agri_order[4],  # end_point (delivery location)
                        "is_urgent": False,
                        "total_price": float(total_price),
                        "order_type": "購買類",
                        "order_status": agri_order[5],
                        "note": agri_order[6] or "",
                        "service": "agricultural_product",
                        "timestamp": agri_order[7],
                        "items": [{
                            "item_id": agri_order[8],
                            "item_name": agri_order[9],
                            "price": float(agri_order[10]),
                            "quantity": int(agri_order[11]),
                            "img": agri_order[12],
                            "location": agri_order[13],  # starting_point (pickup location)
                            "category": agri_order[14]
                        }]
                    }
        
        if not order_data:
            raise HTTPException(status_code=404, detail="訂單不存在")
        
        log_event("FETCH_ORDER_SUCCESS", {
            "order_id": order_id,
            "service": order_data.get("service", "unknown"),
            "total_price": order_data["total_price"],
            "status": "success"
        })
        return order_data
        
    except HTTPException as e:
        log_event("FETCH_ORDER_FAILED", {
            "order_id": order_id,
            "reason": "訂單不存在"
        })
        raise e
    except Exception as e:
        log_event("FETCH_ORDER_ERROR", {
            "order_id": order_id,
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

@router.get("/{order_id}/driver-info")
async def get_order_driver_info(order_id: int, conn: Connection = Depends(get_db)):
    """
    Get driver information for a specific order.
    Args:
        order_id (int): The ID of the order.
        conn (Connection): The database connection.
    Returns:
        dict: Driver information if order is accepted by a driver.
    """
    cur = conn.cursor()
    try:
        # Get driver info from driver_orders and drivers tables
        cur.execute("""
            SELECT d.driver_name, d.driver_phone, dro.timestamp, dro.service, d.id as driver_id, u.location as driver_location
            FROM driver_orders dro
            JOIN drivers d ON dro.driver_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE dro.order_id = %s AND dro.action = '接單'
            ORDER BY dro.timestamp DESC
            LIMIT 1
        """, (order_id,))
        
        driver_info = cur.fetchone()
        if not driver_info:
            raise HTTPException(status_code=404, detail="此訂單尚未被司機接單")
        
        return {
            "driver_name": driver_info[0],
            "driver_phone": driver_info[1],
            "accepted_at": format_timestamp(driver_info[2]),
            "service": driver_info[3],
            "driver_id": driver_info[4],
            "driver_location": driver_info[5]
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error("Error fetching driver info: %s", str(e))
        raise HTTPException(status_code=500, detail="獲取司機資訊失敗") from e
    finally:
        cur.close()

@router.post("/{service}/{order_id}/cancel")
async def cancel_order(service: str, order_id: int, request: CancelOrderRequest, conn: Connection = Depends(get_db)):
    """
    Cancel an order. Buyer can only cancel if order status is '未接單' or '接單' (before driver picks up).
    
    Args:
        service (str): The service type ('necessities' or 'agricultural_product').
        order_id (int): The ID of the order to cancel.
        request (CancelOrderRequest): The cancellation request containing buyer_id.
        conn (Connection): The database connection.
    
    Returns:
        dict: Success message.
    """
    cur = conn.cursor()
    try:
        buyer_id = request.buyer_id
        
        if service == 'necessities':
            # Get order details and verify buyer
            cur.execute("""
                SELECT id, buyer_id, order_status
                FROM orders
                WHERE id = %s
                FOR UPDATE
            """, (order_id,))
            
            order = cur.fetchone()
            if not order:
                raise HTTPException(status_code=404, detail="訂單不存在")
            
            # Verify buyer owns the order
            if order[1] != buyer_id:
                raise HTTPException(status_code=403, detail="無權限取消此訂單")
            
            # Check if order can be cancelled (only if status is '未接單' or '接單')
            if order[2] not in ['未接單', '接單']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"訂單狀態為 '{order[2]}'，無法取消。只有未接單或已接單的訂單可以取消。"
                )
            
            # Check if driver has already accepted the order
            cur.execute("""
                SELECT driver_id, d.driver_name, d.driver_phone, d.user_id
                FROM driver_orders dro
                JOIN drivers d ON dro.driver_id = d.id
                WHERE dro.order_id = %s AND dro.action = '接單'
            """, (order_id,))
            
            driver_info = cur.fetchone()
            
            # Update order status to cancelled
            cur.execute("""
                UPDATE orders
                SET order_status = '已取消'
                WHERE id = %s
            """, (order_id,))
            
            # Delete driver_orders record if exists
            if driver_info:
                cur.execute("""
                    DELETE FROM driver_orders
                    WHERE order_id = %s AND action = '接單'
                """, (order_id,))
            
            conn.commit()
            
            # Send notification to driver if order was already accepted
            if driver_info:
                driver_user_id = driver_info[3]
                message = (
                    f"⚠️ 訂單 #{order_id} 已被買家取消\n"
                    f"買家已取消此訂單，無需再配送。"
                )
                success = await line_service.send_message_to_user(driver_user_id, message)
                if not success:
                    logging.warning(f"司機 (ID: {driver_user_id}) 未綁定 LINE 帳號或發送通知失敗")
            
            log_event("ORDER_CANCELLED", {
                "order_id": order_id,
                "buyer_id": buyer_id,
                "service": service,
                "had_driver": driver_info is not None
            })
            
            return {
                "status": "success",
                "message": "訂單已成功取消"
            }
            
        elif service == 'agricultural_product':
            # Get order details and verify buyer
            cur.execute("""
                SELECT id, buyer_id, status
                FROM agricultural_product_order
                WHERE id = %s
                FOR UPDATE
            """, (order_id,))
            
            order = cur.fetchone()
            if not order:
                raise HTTPException(status_code=404, detail="訂單不存在")
            
            # Verify buyer owns the order
            if order[1] != buyer_id:
                raise HTTPException(status_code=403, detail="無權限取消此訂單")
            
            # Check if order can be cancelled (only if status is '未接單' or '接單')
            if order[2] not in ['未接單', '接單']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"訂單狀態為 '{order[2]}'，無法取消。只有未接單或已接單的訂單可以取消。"
                )
            
            # Check if driver has already accepted the order
            cur.execute("""
                SELECT driver_id, d.driver_name, d.driver_phone, d.user_id
                FROM driver_orders dro
                JOIN drivers d ON dro.driver_id = d.id
                WHERE dro.order_id = %s AND dro.action = '接單'
            """, (order_id,))
            
            driver_info = cur.fetchone()
            
            # Update order status to cancelled
            cur.execute("""
                UPDATE agricultural_product_order
                SET status = '已取消'
                WHERE id = %s
            """, (order_id,))
            
            # Delete driver_orders record if exists
            if driver_info:
                cur.execute("""
                    DELETE FROM driver_orders
                    WHERE order_id = %s AND action = '接單'
                """, (order_id,))
            
            conn.commit()
            
            # Send notification to driver if order was already accepted
            if driver_info:
                driver_user_id = driver_info[3]
                message = (
                    f"⚠️ 訂單 #{order_id} 已被買家取消\n"
                    f"買家已取消此訂單，無需再配送。"
                )
                success = await line_service.send_message_to_user(driver_user_id, message)
                if not success:
                    logging.warning(f"司機 (ID: {driver_user_id}) 未綁定 LINE 帳號或發送通知失敗")
            
            log_event("ORDER_CANCELLED", {
                "order_id": order_id,
                "buyer_id": buyer_id,
                "service": service,
                "had_driver": driver_info is not None
            })
            
            return {
                "status": "success",
                "message": "訂單已成功取消"
            }
        else:
            raise HTTPException(status_code=400, detail="不支援的服務類型")
            
    except HTTPException as he:
        conn.rollback()
        raise he
    except Exception as e:
        conn.rollback()
        logging.error("Error cancelling order: %s", str(e))
        raise HTTPException(status_code=500, detail="取消訂單失敗") from e
    finally:
        cur.close()

@router.get("/buyer/{buyer_id}")
async def get_buyer_orders(buyer_id: int, conn: Connection = Depends(get_db)):
    """
    Get all orders for a specific buyer.
    Args:
        buyer_id (int): The ID of the buyer.
        conn (Connection): The database connection.
    Returns:
        List[dict]: List of orders for the buyer.
    """
    cur = conn.cursor()
    try:
        order_list = []
        
        # Get regular orders
        cur.execute("""
            SELECT id, buyer_id, buyer_name, buyer_phone, location, is_urgent, total_price,
                   order_type, order_status, note, timestamp
            FROM orders
            WHERE buyer_id = %s
            ORDER BY timestamp DESC
        """, (buyer_id,))
        
        orders = cur.fetchall()
        for order in orders:
            # Get order items
            cur.execute("SELECT item_id, item_name, price, quantity, img, location, category FROM order_items WHERE order_id = %s", (order[0],))
            items = cur.fetchall()
            
            order_dict = {
                "id": order[0],
                "buyer_id": order[1],
                "buyer_name": order[2],
                "buyer_phone": order[3],
                "location": order[4],
                "is_urgent": bool(order[5]),
                "total_price": float(order[6]),
                "order_type": order[7],
                "order_status": order[8],
                "note": order[9],
                "timestamp": format_timestamp(order[10]),
                "service": "necessities",
                "items": [{
                    "item_id": item[0],
                    "item_name": item[1],
                    "price": float(item[2]),
                    "quantity": int(item[3]),
                    "img": item[4],
                    "location": item[5],
                    "category": item[6]
                } for item in items]
            }
            order_list.append(order_dict)
        
        # Get agricultural product orders
        cur.execute("""
            SELECT agri_p_o.id, agri_p_o.buyer_id, agri_p_o.buyer_name, agri_p_o.buyer_phone,
                   agri_p_o.end_point, agri_p_o.status, agri_p_o.note, agri_p_o.timestamp,
                   agri_p.id, agri_p.name, agri_p.price, agri_p_o.quantity, agri_p.img_link,
                   agri_p_o.starting_point, agri_p.category
            FROM agricultural_product_order as agri_p_o
            JOIN agricultural_produce as agri_p on agri_p.id = agri_p_o.produce_id
            WHERE agri_p_o.buyer_id = %s
            ORDER BY agri_p_o.timestamp DESC
        """, (buyer_id,))
        
        agri_orders = cur.fetchall()
        for agri_order in agri_orders:
            total_price = agri_order[10] * agri_order[11]  # price * quantity
            
            agri_order_dict = {
                "id": agri_order[0],
                "buyer_id": agri_order[1],
                "buyer_name": agri_order[2],
                "buyer_phone": agri_order[3],
                "location": agri_order[4],  # end_point
                "is_urgent": False,
                "total_price": float(total_price),
                "order_type": "購買類",
                "order_status": agri_order[5],  # status
                "note": agri_order[6] or "",
                "timestamp": format_timestamp(agri_order[7]),
                "service": "agricultural_product",
                "items": [{
                    "item_id": agri_order[8],
                    "item_name": agri_order[9],
                    "price": float(agri_order[10]),
                    "quantity": int(agri_order[11]),
                    "img": agri_order[12],
                    "location": agri_order[13],  # starting_point
                    "category": agri_order[14]
                }]
            }
            order_list.append(agri_order_dict)
        
        # Sort by timestamp (newest first)
        order_list.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        
        return order_list
        
    except Exception as e:
        logging.error("Error fetching buyer orders: %s", str(e))
        raise HTTPException(status_code=500, detail="獲取訂單失敗") from e
    finally:
        cur.close()


@router.post("/{service}/{order_id}/complete")
async def complete_order(service: str, order_id: int, conn: Connection = Depends(get_db), request: Request = None):
    """
    Complete an order.
    Args:
        service (str): The service type ('necessities' or 'agricultural_product').
        order_id (int): The ID of the order to be completed.
        conn (Connection): The database connection.
        request (Request): The incoming request.
    Returns:
        dict: A success message.
    """
    cur = conn.cursor()
    try:
        log_event("ORDER_COMPLETION_STARTED", {
            "order_id": order_id,
            "service": service,
            "endpoint": str(request.url) if request else "N/A",
            "client_ip": request.client.host if request else "N/A"
        })
        
        if service == 'necessities':
            # Check if order exists and get driver info
            cur.execute("""
                SELECT 
                    o.id, o.buyer_id, o.buyer_name, o.buyer_phone, 
                    o.seller_id, o.seller_name, o.seller_phone,
                    o.date, o.time, o.location, o.is_urgent,
                    o.total_price, o.order_type, o.order_status,
                    oi.item_name, oi.quantity, oi.price, oi.img,
                    d.driver_phone as driver_phone
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN driver_orders dro ON o.id = dro.order_id AND dro.service = 'necessities'
                LEFT JOIN drivers d ON dro.driver_id = d.id
                WHERE o.id = %s
            """, (order_id,))
            order_data = cur.fetchall()
            
            if not order_data:
                raise HTTPException(status_code=404, detail="訂單不存在")
                
            order = order_data[0]
            if order[13] != '接單':  # order_status
                raise HTTPException(status_code=400, detail="訂單狀態不是接單，無法完成訂單")
            
            # Format order details message
            buyer_id = order[1]  # buyer_id
            total_price = float(order[11])  # total_price
            delivery_address = order[9]  # location
            driver_phone = order[-1] if order[-1] else "無"  # driver_phone
            
            message = "您的貨品已送達目的地，請盡快到指定地點領取 😊\n\n"
            message += "📦 訂單編號 #" + str(order_id) + "\n"
            message += f"📍 送貨地點：{delivery_address}\n"
            message += f"📱 司機電話：{driver_phone}\n"
            message += "─────────────\n"
            
            for item in order_data:
                item_name = item[14]       # item_name
                quantity = int(item[15])   # quantity
                price = float(item[16])    # price
                subtotal = price * quantity
                message += f"・{item_name}\n"
                message += f"  ${price} x {quantity} = ${subtotal}\n"
            
            message += "─────────────\n"
            message += f"總計: ${total_price} 元"
            
            success = await line_service.send_message_to_user(buyer_id, message)
            if not success:
                logger.warning(f"買家 (ID: {buyer_id}) 未綁定 LINE 帳號或發送通知失敗")
            
            cur.execute("UPDATE orders SET order_status = '已完成' WHERE id = %s", (order_id,))
            
            cur.execute("""
                UPDATE driver_orders dro
                SET action = '完成'
                WHERE order_id = %s and service = %s
            """, (order_id, 'necessities'))
            
        elif service == 'agricultural_product':
            # Check if order exists and get driver info
            cur.execute("""
                SELECT 
                    o.id, o.buyer_id, o.buyer_name, o.buyer_phone,
                    o.end_point, o.status, o.is_put,
                    o.starting_point, o.note, o.timestamp,
                    p.name as product_name, p.price, o.quantity,
                    d.driver_phone as driver_phone
                FROM agricultural_product_order o
                LEFT JOIN agricultural_produce p ON p.id = o.produce_id
                LEFT JOIN driver_orders dro ON o.id = dro.order_id AND dro.service = 'agricultural_product'
                LEFT JOIN drivers d ON dro.driver_id = d.id
                WHERE o.id = %s
            """, (order_id,))
            order_data = cur.fetchall()
            
            if not order_data:
                raise HTTPException(status_code=404, detail="訂單不存在")
                
            order = order_data[0]
            if order[5] != '接單':  # status
                raise HTTPException(status_code=400, detail="訂單狀態不是接單，無法完成訂單")
            
            # Format order details message
            buyer_id = order[1]
            delivery_address = order[4]  # end_point
            driver_phone = order[-1] if order[-1] else "無"  # driver_phone
            
            message = "您的農產品已送達目的地，請盡快到指定地點領取 🌾\n\n"
            message += "📦 訂單編號 #" + str(order_id) + "\n"
            message += f"📍 送貨地點：{delivery_address}\n"
            message += f"📱 司機電話：{driver_phone}\n"
            message += "─────────────\n"
            
            item_name = order[10]     # product_name
            price = float(order[11])  # price
            quantity = int(order[12]) # quantity
            total_price = price * quantity
            
            message += f"・{item_name}\n"
            message += f"  ${price} x {quantity} = ${total_price}\n"
            message += "─────────────\n"
            message += f"總計: ${total_price} 元"
            
            success = await line_service.send_message_to_user(buyer_id, message)
            if not success:
                logger.warning(f"買家 (ID: {buyer_id}) 未綁定 LINE 帳號或發送通知失敗")
            
            cur.execute("UPDATE agricultural_product_order SET status = '已送達' WHERE id = %s", (order_id,))
            
            cur.execute("""
                UPDATE driver_orders dro
                SET action = '完成'
                WHERE order_id = %s and service = %s
            """, (order_id, 'agricultural_product'))
        
        conn.commit()
        log_event("ORDER_COMPLETED", {
            "order_id": order_id,
            "service": service,
            "status": "success"
        })
        return {"status": "success", "message": "訂單已完成"}
        
    except HTTPException as e:
        conn.rollback()
        if e.status_code == 400:
            logging.error("訂單狀態不正確，無法完成訂單")
            log_event("ORDER_COMPLETION_FAILED", {
                "order_id": order_id,
                "service": service,
                "reason": "訂單狀態不正確"
            })
        elif e.status_code == 404:
            logging.error("訂單不存在")
            log_event("ORDER_COMPLETION_FAILED", {
                "order_id": order_id,
                "service": service,
                "reason": "訂單不存在"
            })
        raise e
    except Exception as e:
        log_event("ORDER_COMPLETION_ERROR", {
            "order_id": order_id,
            "service": service,
            "error": str(e)
        })
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()
