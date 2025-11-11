from fastapi import APIRouter, HTTPException, Response
from datetime import datetime, timedelta
import pandas as pd
import io
import json
from typing import List, Dict, Any
from backend.database import get_db_connection

router = APIRouter()

@router.post("/cleanup-old-history")
async def cleanup_old_history():
    """
    Clean up transaction history older than 3 months
    Returns count of deleted records
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calculate cutoff date (3 months ago)
        cutoff_date = datetime.now() - timedelta(days=90)
        cutoff_str = cutoff_date.strftime('%Y-%m-%d %H:%M:%S')
        
        # Count records to be deleted
        count_query = """
        SELECT 
            (SELECT COUNT(*) FROM orders WHERE timestamp < %s AND order_status = '已送達') +
            (SELECT COUNT(*) FROM agricultural_product_order WHERE timestamp < %s AND status = '已送達') as total_count
        """
        cursor.execute(count_query, (cutoff_str, cutoff_str))
        total_count = cursor.fetchone()[0]
        
        # Delete old completed orders
        delete_orders_query = """
        DELETE FROM orders 
        WHERE timestamp < %s AND order_status = '已送達'
        """
        cursor.execute(delete_orders_query, (cutoff_str,))
        
        # Delete old completed agricultural orders
        delete_agri_query = """
        DELETE FROM agricultural_product_order 
        WHERE timestamp < %s AND status = '已送達'
        """
        cursor.execute(delete_agri_query, (cutoff_str,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "deleted_count": total_count,
            "cutoff_date": cutoff_str,
            "message": f"Successfully deleted {total_count} old transaction records"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/export-driver-history/{driver_id}")
async def export_driver_history(driver_id: int, format: str = "excel"):
    """
    Export driver's transaction history
    Formats: excel, csv, json
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get driver's completed orders
        # Use subquery to get the most recent driver_orders entry for each order
        # This ensures we get all completed orders even if there are multiple driver_orders entries
        query = """
        SELECT 
            o.id as order_id,
            o.timestamp,
            o.location,
            o.total_price,
            o.order_status,
            u.name as buyer_name,
            u.phone as buyer_phone,
            'store' as order_type
        FROM orders o
        JOIN users u ON o.buyer_id = u.id
        WHERE o.order_status = '已送達'
        AND EXISTS (
            SELECT 1 
            FROM driver_orders dro 
            WHERE dro.order_id = o.id 
            AND dro.service = 'necessities' 
            AND dro.driver_id = %s
        )
        
        UNION ALL
        
        SELECT 
            apo.id as order_id,
            apo.timestamp,
            apo.end_point as location,
            (ap.price * apo.quantity) as total_price,
            apo.status as order_status,
            u.name as buyer_name,
            u.phone as buyer_phone,
            'agricultural' as order_type
        FROM agricultural_product_order apo
        JOIN agricultural_produce ap ON apo.produce_id = ap.id
        JOIN users u ON apo.buyer_id = u.id
        WHERE apo.status = '已送達'
        AND EXISTS (
            SELECT 1 
            FROM driver_orders dro 
            WHERE dro.order_id = apo.id 
            AND dro.service = 'agricultural_product' 
            AND dro.driver_id = %s
        )
        
        ORDER BY timestamp DESC
        """
        
        cursor.execute(query, (driver_id, driver_id))
        results = cursor.fetchall()
        
        if not results:
            raise HTTPException(status_code=404, detail="No transaction history found")
        
        # Convert to DataFrame
        columns = ['order_id', 'timestamp', 'location', 'total_price', 'order_status', 'buyer_name', 'buyer_phone', 'order_type']
        df = pd.DataFrame(results, columns=columns)
        
        # Format datetime
        df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        if format.lower() == "excel":
            # Create Excel file
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Driver_History', index=False)
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=driver_{driver_id}_history.xlsx"}
            )
            
        elif format.lower() == "csv":
            # Create CSV file
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=driver_{driver_id}_history.csv"}
            )
            
        elif format.lower() == "json":
            # Create JSON file
            json_data = df.to_dict('records')
            
            return Response(
                content=json.dumps(json_data, ensure_ascii=False, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=driver_{driver_id}_history.json"}
            )
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use: excel, csv, or json")
            
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export-buyer-history/{user_id}")
async def export_buyer_history(user_id: int, format: str = "excel"):
    """
    Export buyer's transaction history
    Formats: excel, csv, json
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get buyer's completed orders
        query = """
        SELECT 
            o.id as order_id,
            o.timestamp,
            o.location,
            o.total_price,
            o.order_status,
            COALESCE(dr.driver_name, 'N/A') as driver_name,
            COALESCE(dr.driver_phone, 'N/A') as driver_phone,
            'store' as order_type
        FROM orders o
        LEFT JOIN driver_orders dro ON o.id = dro.order_id AND dro.service = 'necessities'
        LEFT JOIN drivers dr ON dro.driver_id = dr.id
        WHERE o.buyer_id = %s AND o.order_status = '已送達'
        
        UNION ALL
        
        SELECT 
            apo.id as order_id,
            apo.timestamp,
            apo.end_point as location,
            (ap.price * apo.quantity) as total_price,
            apo.status as order_status,
            COALESCE(dr.driver_name, 'N/A') as driver_name,
            COALESCE(dr.driver_phone, 'N/A') as driver_phone,
            'agricultural' as order_type
        FROM agricultural_product_order apo
        JOIN agricultural_produce ap ON apo.produce_id = ap.id
        LEFT JOIN driver_orders dro ON apo.id = dro.order_id AND dro.service = 'agricultural_product'
        LEFT JOIN drivers dr ON dro.driver_id = dr.id
        WHERE apo.buyer_id = %s AND apo.status = '已送達'
        
        ORDER BY timestamp DESC
        """
        
        cursor.execute(query, (user_id, user_id))
        results = cursor.fetchall()
        
        if not results:
            raise HTTPException(status_code=404, detail="No transaction history found")
        
        # Convert to DataFrame
        columns = ['order_id', 'timestamp', 'location', 'total_price', 'order_status', 'driver_name', 'driver_phone', 'order_type']
        df = pd.DataFrame(results, columns=columns)
        
        # Format datetime
        df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        if format.lower() == "excel":
            # Create Excel file
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Buyer_History', index=False)
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=buyer_{user_id}_history.xlsx"}
            )
            
        elif format.lower() == "csv":
            # Create CSV file
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=buyer_{user_id}_history.csv"}
            )
            
        elif format.lower() == "json":
            # Create JSON file
            json_data = df.to_dict('records')
            
            return Response(
                content=json.dumps(json_data, ensure_ascii=False, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=buyer_{user_id}_history.json"}
            )
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use: excel, csv, or json")
            
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history-stats")
async def get_history_stats():
    """
    Get statistics about transaction history
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get stats for different time periods
        stats_query = """
        SELECT 
            'last_30_days' as period,
            COUNT(*) as total_orders,
            SUM(total_price) as total_revenue
        FROM (
            SELECT total_price, timestamp FROM orders WHERE order_status = '已送達'
            UNION ALL
            SELECT (ap.price * apo.quantity) as total_price, apo.timestamp 
            FROM agricultural_product_order apo
            JOIN agricultural_produce ap ON apo.produce_id = ap.id
            WHERE apo.status = '已送達'
        ) combined
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        SELECT 
            'last_90_days' as period,
            COUNT(*) as total_orders,
            SUM(total_price) as total_revenue
        FROM (
            SELECT total_price, timestamp FROM orders WHERE order_status = '已送達'
            UNION ALL
            SELECT (ap.price * apo.quantity) as total_price, apo.timestamp 
            FROM agricultural_product_order apo
            JOIN agricultural_produce ap ON apo.produce_id = ap.id
            WHERE apo.status = '已送達'
        ) combined
        WHERE timestamp >= NOW() - INTERVAL '90 days'
        
        UNION ALL
        
        SELECT 
            'older_than_90_days' as period,
            COUNT(*) as total_orders,
            SUM(total_price) as total_revenue
        FROM (
            SELECT total_price, timestamp FROM orders WHERE order_status = '已送達'
            UNION ALL
            SELECT (ap.price * apo.quantity) as total_price, apo.timestamp 
            FROM agricultural_product_order apo
            JOIN agricultural_produce ap ON apo.produce_id = ap.id
            WHERE apo.status = '已送達'
        ) combined
        WHERE timestamp < NOW() - INTERVAL '90 days'
        """
        
        cursor.execute(stats_query)
        results = cursor.fetchall()
        
        stats = {}
        for period, total_orders, total_revenue in results:
            stats[period] = {
                "total_orders": total_orders or 0,
                "total_revenue": float(total_revenue or 0)
            }
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "stats": stats,
            "cleanup_recommendation": stats.get('older_than_90_days', {}).get('total_orders', 0) > 0
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/export-seller-history/{seller_id}")
async def export_seller_history(seller_id: int, format: str = "excel"):
    """
    Export seller's transaction history
    Formats: excel, csv, json
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get seller's completed orders (both store and agricultural)
        query = """
        SELECT 
            o.id as order_id,
            o.timestamp,
            o.location,
            o.total_price,
            o.order_status,
            u.name as buyer_name,
            u.phone as buyer_phone,
            COALESCE(dr.driver_name, 'N/A') as driver_name,
            'store' as order_type
        FROM orders o
        JOIN users u ON o.buyer_id = u.id
        LEFT JOIN driver_orders dro ON o.id = dro.order_id AND dro.service = 'necessities'
        LEFT JOIN drivers dr ON dro.driver_id = dr.id
        WHERE o.seller_id = %s AND o.order_status = '已送達'
        
        UNION ALL
        
        SELECT 
            apo.id as order_id,
            apo.timestamp,
            apo.end_point as location,
            (ap.price * apo.quantity) as total_price,
            apo.status as order_status,
            u.name as buyer_name,
            u.phone as buyer_phone,
            COALESCE(dr.driver_name, 'N/A') as driver_name,
            'agricultural' as order_type
        FROM agricultural_product_order apo
        JOIN agricultural_produce ap ON apo.produce_id = ap.id
        JOIN users u ON apo.buyer_id = u.id
        LEFT JOIN driver_orders dro ON apo.id = dro.order_id AND dro.service = 'agricultural_product'
        LEFT JOIN drivers dr ON dro.driver_id = dr.id
        WHERE ap.seller_id = %s AND apo.status = '已送達'
        
        ORDER BY timestamp DESC
        """
        
        cursor.execute(query, (seller_id, seller_id))
        results = cursor.fetchall()
        
        if not results:
            raise HTTPException(status_code=404, detail="No transaction history found")
        
        # Convert to DataFrame
        columns = ['order_id', 'timestamp', 'location', 'total_price', 'order_status', 'buyer_name', 'buyer_phone', 'driver_name', 'order_type']
        df = pd.DataFrame(results, columns=columns)
        
        # Format datetime
        df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        
        if format.lower() == "excel":
            # Create Excel file
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Seller_History', index=False)
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=seller_{seller_id}_history.xlsx"}
            )
            
        elif format.lower() == "csv":
            # Create CSV file
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=seller_{seller_id}_history.csv"}
            )
            
        elif format.lower() == "json":
            # Create JSON file
            json_data = df.to_dict('records')
            
            return Response(
                content=json.dumps(json_data, ensure_ascii=False, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=seller_{seller_id}_history.json"}
            )
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use: excel, csv, or json")
            
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
