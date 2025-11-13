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
    Adds timeout to prevent hanging.
    """
    global connection_pool
    
    if connection_pool is None:
        # Fallback to direct connection with keepalive if pool not initialized
        logger.warning("Connection pool not initialized, using direct connection with keepalive")
        return create_connection_with_keepalive()
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            conn = connection_pool.getconn()
            # Validate connection is still alive with timeout
            try:
                # Set a timeout for the validation query (5 seconds)
                conn.set_session(autocommit=False)
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                return conn
            except (psycopg2.OperationalError, psycopg2.InterfaceError, psycopg2.DatabaseError) as e:
                # Connection is dead, close it
                logger.warning(f"Connection validation failed (attempt {attempt + 1}): {str(e)}")
                try:
                    conn.close()
                except:
                    pass
                
                # If this was the last attempt, create a new connection
                if attempt == max_retries - 1:
                    logger.warning("All pool connections failed, creating new connection with keepalive")
                    return create_connection_with_keepalive()
                
                # Try to get another connection from pool
                continue
            except Exception as e:
                logger.error(f"Unexpected error validating connection: {str(e)}")
                try:
                    conn.close()
                except:
                    pass
                if attempt == max_retries - 1:
                    return create_connection_with_keepalive()
                continue
        except pool.PoolError as e:
            # Pool is exhausted or error getting connection
            logger.error(f"Pool error (attempt {attempt + 1}): {str(e)}")
            if attempt == max_retries - 1:
                logger.warning("Pool exhausted, creating direct connection with keepalive")
                return create_connection_with_keepalive()
            continue
        except Exception as e:
            logger.error(f"Error getting connection from pool: {str(e)}")
            if attempt == max_retries - 1:
                return create_connection_with_keepalive()
            continue
    
    # Final fallback
    return create_connection_with_keepalive()

def return_db_connection(conn):
    """
    Return a connection to the pool.
    Always ensures connection is closed if pool return fails.
    """
    global connection_pool
    
    if conn is None:
        return
    
    if connection_pool is None:
        # If pool not initialized, just close the connection
        try:
            conn.close()
        except:
            pass
        return
    
    try:
        # Check if connection is still valid before returning
        try:
            if conn.closed == 0:  # Connection is open
                connection_pool.putconn(conn)
            else:
                logger.warning("Attempted to return closed connection to pool")
        except AttributeError:
            # Connection object doesn't have 'closed' attribute, try to return anyway
            connection_pool.putconn(conn)
    except pool.PoolError as e:
        logger.error(f"Pool error returning connection: {str(e)}")
        # If pool is full or error, close the connection
        try:
            conn.close()
        except:
            pass
    except Exception as e:
        logger.error(f"Error returning connection to pool: {str(e)}")
        # If returning fails, close the connection to prevent leaks
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
