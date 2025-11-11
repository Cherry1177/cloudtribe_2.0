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

def init_connection_pool():
    """
    Initialize the database connection pool.
    """
    global connection_pool
    try:
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
    """
    global connection_pool
    
    if connection_pool is None:
        # Fallback to direct connection if pool not initialized
        logger.warning("Connection pool not initialized, using direct connection")
        return psycopg2.connect(database_url)
    
    try:
        return connection_pool.getconn()
    except Exception as e:
        logger.error(f"Error getting connection from pool: {str(e)}")
        # Fallback to direct connection
        return psycopg2.connect(database_url)

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
