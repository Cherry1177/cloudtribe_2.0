"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faTrashAlt, 
  faChartBar, 
  faFileExcel, 
  faFileCsv, 
  faFileCode,
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import historyService, { HistoryStats, CleanupResult } from '@/services/history/historyService';

interface HistoryManagementProps {
  userId: number;
  userType: 'driver' | 'buyer' | 'seller';
  userName?: string;
}

const HistoryManagement: React.FC<HistoryManagementProps> = ({ 
  userId, 
  userType, 
  userName 
}) => {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [showCleanupRecommendation, setShowCleanupRecommendation] = useState(false);

  useEffect(() => {
    loadHistoryStats();
  }, []);

  const loadHistoryStats = async () => {
    setLoading(true);
    try {
      const result = await historyService.getHistoryStats();
      if (result.success) {
        setStats(result.stats);
        setShowCleanupRecommendation(result.cleanup_recommendation);
      }
    } catch (error) {
      console.error('Error loading history stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('確定要清理3個月前的交易記錄嗎？此操作無法復原。建議先匯出備份。')) {
      return;
    }

    setCleanupLoading(true);
    try {
      const result = await historyService.cleanupOldHistory();
      setCleanupResult(result);
      if (result.success) {
        // Reload stats after cleanup
        await loadHistoryStats();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      setCleanupResult({
        success: false,
        deleted_count: 0,
        cutoff_date: '',
        message: '',
        error: String(error)
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(format);
    try {
      if (userType === 'driver') {
        await historyService.exportDriverHistory(userId, format);
      } else if (userType === 'buyer') {
        await historyService.exportBuyerHistory(userId, format);
      } else if (userType === 'seller') {
        await historyService.exportSellerHistory(userId, format);
      }
      
      // Show success message
      alert(`交易記錄已成功匯出為 ${format.toUpperCase()} 格式！`);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = String(error).replace('Error: ', '');
      
      if (errorMessage.includes('No transaction history found') || errorMessage.includes('404')) {
        alert(`目前沒有交易記錄可以匯出。完成一些交易後再試試看！`);
      } else {
        alert(`匯出失敗：${errorMessage}`);
      }
    } finally {
      setExportLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faChartBar} className="w-5 h-5 text-blue-600" />
            <span>交易記錄統計</span>
          </CardTitle>
          <CardDescription>
            {userType === 'driver' ? '司機' : userType === 'buyer' ? '買家' : '賣家'}交易記錄概覽與管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">載入中...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">最近30天</h3>
                <p className="text-2xl font-bold text-green-600">{stats.last_30_days.total_orders}</p>
                <p className="text-sm text-green-700">筆交易</p>
                <p className="text-lg font-semibold text-green-600 mt-1">
                  {formatCurrency(stats.last_30_days.total_revenue)}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">最近90天</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.last_90_days.total_orders}</p>
                <p className="text-sm text-blue-700">筆交易</p>
                <p className="text-lg font-semibold text-blue-600 mt-1">
                  {formatCurrency(stats.last_90_days.total_revenue)}
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">90天前</h3>
                <p className="text-2xl font-bold text-orange-600">{stats.older_than_90_days.total_orders}</p>
                <p className="text-sm text-orange-700">筆交易</p>
                <p className="text-lg font-semibold text-orange-600 mt-1">
                  {formatCurrency(stats.older_than_90_days.total_revenue)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">無法載入統計資料</div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Recommendation Alert */}
      {showCleanupRecommendation && (
        <Alert className="border-orange-200 bg-orange-50">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            系統偵測到有超過3個月的舊交易記錄，建議進行清理以優化系統效能。
            <strong>清理前請先匯出備份！</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Cleanup Result Alert */}
      {cleanupResult && (
        <Alert className={cleanupResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <FontAwesomeIcon 
            icon={cleanupResult.success ? faCheckCircle : faExclamationTriangle} 
            className={`w-4 h-4 ${cleanupResult.success ? 'text-green-600' : 'text-red-600'}`} 
          />
          <AlertDescription className={cleanupResult.success ? "text-green-800" : "text-red-800"}>
            {cleanupResult.success ? cleanupResult.message : `清理失敗：${cleanupResult.error}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faDownload} className="w-5 h-5 text-green-600" />
            <span>匯出交易記錄</span>
          </CardTitle>
          <CardDescription>
            將您的交易記錄匯出為不同格式的檔案
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleExport('excel')}
              disabled={exportLoading === 'excel'}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faFileExcel} className="w-4 h-4" />
              <span>{exportLoading === 'excel' ? '匯出中...' : 'Excel 格式'}</span>
            </Button>
            
            <Button
              onClick={() => handleExport('csv')}
              disabled={exportLoading === 'csv'}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faFileCsv} className="w-4 h-4" />
              <span>{exportLoading === 'csv' ? '匯出中...' : 'CSV 格式'}</span>
            </Button>
            
            <Button
              onClick={() => handleExport('json')}
              disabled={exportLoading === 'json'}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faFileCode} className="w-4 h-4" />
              <span>{exportLoading === 'json' ? '匯出中...' : 'JSON 格式'}</span>
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Excel：</strong>適合查看和分析，支援圖表功能</p>
            <p><strong>CSV：</strong>通用格式，可匯入其他系統</p>
            <p><strong>JSON：</strong>程式開發用途，結構化資料</p>
          </div>
        </CardContent>
      </Card>

      {/* Cleanup Section */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <FontAwesomeIcon icon={faTrashAlt} className="w-5 h-5" />
            <span>清理舊記錄</span>
          </CardTitle>
          <CardDescription className="text-red-600">
            清理3個月前的交易記錄以優化系統效能（此操作無法復原）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ 重要提醒</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 此操作將永久刪除3個月前的所有已完成交易記錄</li>
              <li>• 建議在清理前先匯出備份檔案</li>
              <li>• 清理後無法復原，請謹慎操作</li>
            </ul>
          </div>
          
          <Button
            onClick={handleCleanup}
            disabled={cleanupLoading || !stats?.older_than_90_days.total_orders}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4" />
            <span>
              {cleanupLoading 
                ? '清理中...' 
                : stats?.older_than_90_days.total_orders 
                  ? `清理 ${stats.older_than_90_days.total_orders} 筆舊記錄`
                  : '無舊記錄需要清理'
              }
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryManagement;
