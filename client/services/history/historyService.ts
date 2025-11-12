export interface HistoryStats {
  last_30_days: {
    total_orders: number;
    total_revenue: number;
  };
  last_90_days: {
    total_orders: number;
    total_revenue: number;
  };
  older_than_90_days: {
    total_orders: number;
    total_revenue: number;
  };
}

export interface CleanupResult {
  success: boolean;
  deleted_count: number;
  cutoff_date: string;
  message: string;
  error?: string;
}

class HistoryService {

  /**
   * Get transaction history statistics
   */
  async getHistoryStats(): Promise<{ success: boolean; stats: HistoryStats; cleanup_recommendation: boolean; error?: string }> {
    try {
      const response = await fetch('/api/history/history-stats', {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        return { 
          success: false, 
          stats: {
            last_30_days: { total_orders: 0, total_revenue: 0 },
            last_90_days: { total_orders: 0, total_revenue: 0 },
            older_than_90_days: { total_orders: 0, total_revenue: 0 }
          }, 
          cleanup_recommendation: false, 
          error: errorData.detail || `HTTP ${response.status}` 
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching history stats:', error);
      const errorMessage = error.name === 'AbortError' 
        ? '請求超時，請稍後再試'
        : error.message || '無法載入統計資料';
      return { 
        success: false, 
        stats: {
          last_30_days: { total_orders: 0, total_revenue: 0 },
          last_90_days: { total_orders: 0, total_revenue: 0 },
          older_than_90_days: { total_orders: 0, total_revenue: 0 }
        }, 
        cleanup_recommendation: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Clean up old transaction history (older than 3 months)
   */
  async cleanupOldHistory(): Promise<CleanupResult> {
    try {
      const response = await fetch('/api/history/cleanup-old-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error cleaning up history:', error);
      return { success: false, deleted_count: 0, cutoff_date: '', message: '', error: String(error) };
    }
  }

  /**
   * Export driver's transaction history
   */
  async exportDriverHistory(driverId: number, format: 'excel' | 'csv' | 'json' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/history/export-driver-history/${driverId}?format=${format}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'No transaction history found');
        }
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `driver_${driverId}_history.${format === 'excel' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting driver history:', error);
      throw error;
    }
  }

  /**
   * Export buyer's transaction history
   */
  async exportBuyerHistory(userId: number, format: 'excel' | 'csv' | 'json' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/history/export-buyer-history/${userId}?format=${format}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'No transaction history found');
        }
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `buyer_${userId}_history.${format === 'excel' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting buyer history:', error);
      throw error;
    }
  }

  /**
   * Export seller's transaction history
   */
  async exportSellerHistory(sellerId: number, format: 'excel' | 'csv' | 'json' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/history/export-seller-history/${sellerId}?format=${format}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'No transaction history found');
        }
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `seller_${sellerId}_history.${format === 'excel' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting seller history:', error);
      throw error;
    }
  }

  /**
   * Check if cleanup is recommended based on old data
   */
  async shouldRecommendCleanup(): Promise<boolean> {
    const stats = await this.getHistoryStats();
    return stats.cleanup_recommendation;
  }
}

const historyService = new HistoryService();
export default historyService;
