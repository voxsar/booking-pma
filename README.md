# Fifi Resorts PMS - Property Management System

A modern, full-featured Property Management System (PMS) configured with representative data for Fifi Resorts (Pvt) Ltd, property code 30200. Built with Node.js, Express, React, and MariaDB/MySQL.

## Features

### Frontend
- **Dashboard** — Real-time occupancy, revenue metrics, arrivals/departures
- **Room Management** — Visual grid, status tracking, housekeeping coordination
- **Reservations** — Full booking lifecycle, search/filter, payment tracking
- **Check-in/Check-out** — Streamlined guest workflows
- **Guest Management** — CRM with notes, preferences, stay history
- **Housekeeping** — Task board, priority management, status tracking
- **Reports** — Metrics, analytics, revenue insights
- **Multi-property Support** — Manage multiple properties from one interface
- **Authentication** — Secure JWT-based login system
- **Beautiful UI** — Modern, responsive design with dark/light themes

### Backend
- **RESTful API** — Full CRUD operations for all entities
- **Authentication** — JWT-based authentication with role-based access
- **Database** — MariaDB/MySQL with connection pooling
- **Swagger Documentation** — Interactive API docs at `/api/docs`
- **Auto-seeding** — Sample data for testing and development

## Quick Start

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Node.js 18+ and MariaDB/MySQL

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/voxsar/booking-pma.git
cd booking-pma
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
- **Web UI**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

4. Login with demo credentials:
- **Username**: `admin`
- **Password**: `password`

### Option 2: Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Set up MariaDB/MySQL database:
```sql
CREATE DATABASE kavpms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kavpms'@'localhost' IDENTIFIED BY 'Kav@PMS#2026!';
GRANT ALL PRIVILEGES ON kavpms.* TO 'kavpms'@'localhost';
FLUSH PRIVILEGES;
```

3. Configure environment (optional):
```bash
# Create .env file
cat > .env << EOF
DB_HOST=127.0.0.1
DB_USER=kavpms
DB_PASSWORD=Kav@PMS#2026!
DB_NAME=kavpms
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
EOF
```

4. Start the server:
```bash
npm start
```

5. Access the application at http://localhost:3000

## Demo Accounts

The system comes with pre-seeded demo accounts:

| Username | Password | Role    | Description          |
|----------|----------|---------|----------------------|
| admin    | password | admin   | Full system access   |
| elena    | password | manager | Property manager     |
| staff    | password | staff   | Front desk staff     |

## API Documentation

Interactive API documentation is available at http://localhost:3000/api/docs when the server is running.

### Key Endpoints

#### Authentication
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `POST /api/auth/logout` — Logout

#### Core Resources
- `/api/properties` — Properties management
- `/api/room-types` — Room type definitions
- `/api/rooms` — Room inventory
- `/api/guests` — Guest CRM
- `/api/reservations` — Booking management
- `/api/housekeeping` — Housekeeping tasks
- `/api/notifications` — System notifications
- `/api/reports` — Analytics and reports

All protected endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts the server with auto-reload on file changes.

### Database Schema

The application auto-creates tables on first run:
- `users` — User accounts and authentication
- `properties` — Hotel/property listings
- `roomTypes` — Room type definitions
- `rooms` — Room inventory
- `guests` — Guest profiles
- `reservations` — Bookings
- `housekeepingTasks` — Cleaning tasks
- `notifications` — System notifications

### Sample Data

On first run, the database is automatically seeded with:
- 3 demo users (admin, elena, staff)
- Fifi Resorts (Pvt) Ltd, property code 30200
- 5 villa room types: Mount Monarch, Mount Luxe, Sunrise Vista, Eco Harmony, and Forest Escape
- 5 villa suites/chalets matching the Fifi Resorts room naming pattern
- 8 representative guests
- 10 reservations across direct, web, affiliate, phone, and OTA channels
- 5 housekeeping tasks
- 5 notifications

## Architecture

### Backend Stack
- **Node.js** — Runtime
- **Express** — Web framework
- **MariaDB/MySQL** — Database (via mysql2)
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **Swagger UI** — API documentation

### Frontend Stack
- **React 18** — UI framework
- **Babel Standalone** — In-browser JSX compilation
- **CSS Custom Properties** — Theming system
- **No build step** — Direct browser execution

## Configuration

Environment variables (all optional):

| Variable      | Default              | Description              |
|---------------|----------------------|--------------------------|
| `DB_HOST`     | `127.0.0.1`          | Database host            |
| `DB_USER`     | `kavpms`             | Database user            |
| `DB_PASSWORD` | `Kav@PMS#2026!`      | Database password        |
| `DB_NAME`     | `kavpms`             | Database name            |
| `PORT`        | `3000`               | Server port              |
| `JWT_SECRET`  | (auto-generated)     | JWT signing secret       |

## Security Notes

⚠️ **Important**: Before deploying to production:

1. Change the default database password
2. Set a strong `JWT_SECRET` environment variable
3. Use HTTPS/TLS for all connections
4. Change all default user passwords
5. Review and configure CORS settings as needed
6. Enable proper firewall rules
7. Keep dependencies updated

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please visit:
https://github.com/voxsar/booking-pma/issues

## Credits

Built with ❤️ for modern property management.
