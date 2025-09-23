# CloudTribe - 順路經濟平台

### 一個連接真實世界的順路經濟平台，讓您輕鬆建立、組織並壯大社群

**作者**: 張瑞芳 + 王煜凱
**版本**: 2.0.0  
**建立日期**: 2025年1月

### 平台功能展示 

### 1. tribe residents
   
[![tribe residents](https://img.youtube.com/vi/hjn2Sm5dd9s/0.jpg)](https://youtube.com/shorts/hjn2Sm5dd9s)

### 2. drivers
   
[![drivers](https://img.youtube.com/vi/wcOt4QaqB3g/0.jpg)](https://youtu.be/wcOt4QaqB3g)

### 3. buyers
   
[![buyers](https://img.youtube.com/vi/Q4g4HAuLtNw/0.jpg)](https://youtube.com/shorts/Q4g4HAuLtNw)

### 4. sellers
  
[![sellers](https://img.youtube.com/vi/29SxFI6WWD4/0.jpg)](https://youtube.com/shorts/29SxFI6WWD4)




## 專案介紹

CloudTribe 是一個創新的順路經濟平台，旨在連接真實世界中的供需關係，讓社群成員能夠更有效地分享資源和服務。

### 核心理念
- **順路經濟**: 利用現有的移動路線，最大化資源利用效率
- **社群互助**: 建立基於信任的互助網絡
- **永續發展**: 減少不必要的運輸和資源浪費
- **數位化**: 將傳統的口耳相傳轉化為數位化平台

### 平台特色
- **多角色支援**: 買家、賣家、司機三種角色無縫切換
- **智能匹配**: 基於地理位置和需求的智能推薦系統
- **即時通訊**: 整合 LINE Bot 提供即時通知服務
- **路線優化**: 整合 Google Maps API 提供最佳配送路線


## 核心功能

1. **角色選擇與匹配**: 用戶可選擇買家、賣家或司機角色，系統智能匹配訂單需求
2. **訂單管理**: 提供動態表單介面，支援訂單建立、修改和刪除
3. **路線規劃**: 整合 Google Maps API，提供最佳配送路線和時間估算
4. **訂單查詢**: 用戶可追蹤訂單歷史和當前狀態
5. **即時通知**: 透過 LINE Bot 提供訂單狀態更新和重要通知
6. **支付整合**: 支援多種支付方式，確保交易安全




## 技術架構 / Technology Stack

### 前端技術 / Frontend Technologies
- **框架 / Framework**: Next.js 15.3.3 + React 18
- **語言 / Language**: TypeScript
- **樣式 / Styling**: Tailwind CSS
- **UI 組件 / UI Components**: Shadcn/ui
- **狀態管理 / State Management**: React Hooks + Context API

### 後端技術 / Backend Technologies
- **框架 / Framework**: Python 3.11 + FastAPI
- **資料庫 / Database**: PostgreSQL 15
- **ORM**: SQLAlchemy
- **認證 / Authentication**: JWT + OAuth2

### 第三方服務 / Third-party Services
- **地圖服務 / Maps Service**: Google Maps API
- **即時通訊 / Real-time Communication**: LINE Bot API
- **圖片儲存 / Image Storage**: ImgBB API
- **雲端部署 / Cloud Deployment**: AWS EC2 + RDS

### 開發工具 / Development Tools
- **版本控制 / Version Control**: Git
- **包管理 / Package Management**: npm + pip
- **開發環境 / Development Environment**: Docker (可選 / Optional)
- **監控 / Monitoring**: PM2

# System Diagram
![system diagram](https://github.com/user-attachments/assets/2235e7d6-e912-409a-9810-c952205bee2a)


# CloudTribe Setup Instructions

### [Deployment_document](https://github.com/user-attachments/files/18440830/deploy_document.pdf)

## Frontend: Google Maps API Setup

1. Create a `.env.local_template` file in the `client` directory and add the following code:
   ```plaintext
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
   NEXT_PUBLIC_MAP_ID=
   ```

2. Change the file name .env_template to .env

3. Get the API key from [Google Maps Developers](https://developers.google.com/maps?hl=zh-tw).

4. Create a new project and enable the Maps JavaScript API.

5. Go to the Credentials page and create a new API key.

6. Go to Map management to get Map ID.

7. Copy the API key and Map ID. Paste it into the `.env.local` file.

8. Go to the APIs & Services > Library page and enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API

---


## Backend: Database Setup

1. Download and install pgAdmin4 from [pgAdmin4 Download Page](https://www.pgadmin.org/download/).

2. Navigate to the backend directory:

   
         cd backend
  
   
3. Edit the `DATABASE_URL` in `backend/.env_template`:
   For example:  If you want to run in the localhost
   ```python
   DATABASE_URL = "postgresql://postgres:password@localhost:5432/shopping"
   ```

   - `postgresql://`: Database type
   - `postgres`: Username
   - `password`: User password
   - `localhost`: Database host address
   - `5432`: Database port
   - `/shopping`: Database name

5. Change the file name .env_template to .env

6. Open pgAdmin4, go to Servers, and register a new server with the general and connection information as provided.

7. go to backend\database\createtable.sql and  paste the sql query to pgAdmin4 sql query page.

![alt text](img/setting.png)



## Backend: LINE Bot Setup Steps

1. **Create a LINE Bot Account**

   - Go to the [LINE Developer Console](https://developers.line.biz/console) and create a Messaging API Channel.
   - In the **Basic Settings** tab, obtain the `Channel secret`.
   - In the **Messaging API** tab, generate the `Channel access token`.

2. Edit a file in backend\.env , and fill in the content.
   If you don't have the .env file please create it.

   LINE_BOT_TOKEN=
   LINE_BOT_SECRET=
   DATABASE_URL=


## Backend: ImgBB Setup Steps

```
// IMGNBB setting

IMGBB_API_KEY=

[To get IMGBB API KEY](https://api.imgbb.com/)


## How to start

     
         cd backend
         pip install -r requirements.txt
      

 
   Go to the root directory.
   If you in the backend directory.
   
         cd ..
         npm run dev
   

## Deploy 

We use AWS EC2 (t2.micro) and AWS RDS to deploy our project.



