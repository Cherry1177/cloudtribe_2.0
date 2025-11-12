import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
import logging

load_dotenv(dotenv_path="backend/.env")

logger = logging.getLogger(__name__)

# Fetch the DATABASE_URL from environment variables
database_url = os.environ.get('DATABASE_URL')

# Connection pool
connection_pool = None

def create_connection_with_keepalive():
    """
    Create a database connection with keepalive settings to prevent idle timeouts.
    """
    conn = psycopg2.connect(
        database_url,
        keepalives=1,  # Enable TCP keepalive
        keepalives_idle=30,  # Start keepalive after 30 seconds of idle
        keepalives_interval=10,  # Send keepalive every 10 seconds
        keepalives_count=5  # Retry 5 times before considering connection dead
    )
    return conn

def init_connection_pool():
    """
    Initialize the database connection pool.
    Note: SimpleConnectionPool doesn't support connection factory, so keepalive
    is applied when connections are created in fallback scenarios or when
    connections are dead and need to be recreated.
    """
    global connection_pool
    try:
        # SimpleConnectionPool doesn't accept connection parameters directly
        # We'll validate connections when getting them from the pool and apply
        # keepalive settings when creating new connections in fallback scenarios
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=20,  # Maximum 20 connections
            dsn=database_url
        )
        logger.info("✅ Database connection pool initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize connection pool: {str(e)}")
        raise

def get_db_connection():
    """
    Get a database connection from the pool.
    Falls back to direct connection if pool is not initialized.
    Validates connection before returning to ensure it's still alive.
    Applies keepalive settings to prevent idle connection timeouts.
    """
    global connection_pool
    
    if connection_pool is None:
        # Fallback to direct connection with keepalive if pool not initialized
        logger.warning("Connection pool not initialized, using direct connection with keepalive")
        return create_connection_with_keepalive()
    
    try:
        conn = connection_pool.getconn()
        # Validate connection is still alive
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            # Connection is dead, close it and get a new one
            try:
                conn.close()
            except:
                pass
            # Get a new connection from pool
            conn = connection_pool.getconn()
            # Re-validate the new connection
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
            except (psycopg2.OperationalError, psycopg2.InterfaceError):
                # If pool connection is also dead, create a new one with keepalive
                try:
                    conn.close()
                except:
                    pass
                conn = create_connection_with_keepalive()
        return conn
    except Exception as e:
        logger.error(f"Error getting connection from pool: {str(e)}")
        # Fallback to direct connection with keepalive
        return create_connection_with_keepalive()

def return_db_connection(conn):
    """
    Return a connection to the pool.
    """
    global connection_pool
    
    if connection_pool is None:
        # If pool not initialized, just close the connection
        conn.close()
        return
    
    try:
        connection_pool.putconn(conn)
    except Exception as e:
        logger.error(f"Error returning connection to pool: {str(e)}")
        # If returning fails, close the connection
        try:
            conn.close()
        except:
            pass

def close_connection_pool():
    """
    Close all connections in the pool.
    """
    global connection_pool
    
    if connection_pool is not None:
        try:
            connection_pool.closeall()
            logger.info("✅ Database connection pool closed")
        except Exception as e:
            logger.error(f"Error closing connection pool: {str(e)}")
        finally:
            connection_pool = None
