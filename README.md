# 🏫 Campus Resolve

> **AI-Powered Campus Complaint & Resolution Management System**

Campus Resolve is a full-stack web application designed to digitize and streamline the process of reporting, tracking, managing, and resolving campus-related complaints.

The platform provides students with a centralized system to submit complaints, track their status, receive notifications, and communicate with the administration. Administrators can manage complaints, assign them to appropriate departments, update statuses, and monitor the overall resolution process.

---

## 🚀 Why Campus Resolve?

Traditional campus complaint systems often depend on:

* Paper-based complaints
* Manual tracking
* Lack of transparency
* Delayed responses
* Difficulty identifying responsible departments
* No centralized complaint history

**Campus Resolve** addresses these problems by providing a centralized digital platform with automation and AI-assisted complaint management.

---

# ✨ Key Features

## 👨‍🎓 Student Features

### 🔐 Authentication

* Student registration
* Secure login
* JWT-based authentication
* Password encryption
* Role-based access

### 📝 Complaint Management

Students can:

* Submit new complaints
* Add complaint title and description
* Select complaint category
* Upload supporting files/images
* View submitted complaints
* Track complaint status
* View complaint history

### 📊 Complaint Tracking

Students can monitor complaints through different stages:

```text
Submitted
    ↓
Under Review
    ↓
Assigned
    ↓
In Progress
    ↓
Resolved
```

### 🔔 Notifications

Students receive notifications when:

* A complaint is submitted
* Complaint status changes
* Complaint is assigned
* Complaint is resolved
* Important updates are made

---

# 👨‍💼 Admin Features

Administrators have a centralized dashboard to manage campus complaints.

### 📋 Complaint Dashboard

Admins can:

* View all complaints
* Filter complaints
* Search complaints
* View complaint details
* Update complaint status
* Assign complaints
* Manage complaint categories
* Monitor pending complaints

### 📈 Complaint Monitoring

Administrators can monitor:

* Total complaints
* Pending complaints
* In-progress complaints
* Resolved complaints
* Complaint categories
* Resolution activity

---

# 🤖 AI Integration

Campus Resolve includes an AI service designed to assist with complaint processing.

The AI layer can be used for:

* Complaint classification
* Category detection
* Complaint prioritization
* Intelligent analysis
* Automated assistance
* Generating useful complaint insights

### Example

A student submits:

> "The water cooler near the CSE department has not been working for three days."

The AI system can identify:

```text
Category: Infrastructure
Issue: Water Cooler
Department: CSE
Priority: Medium
```

This can help administrators process complaints more efficiently.

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │       Student        │
                    │      / Admin         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Frontend        │
                    │     HTML/CSS/JS      │
                    └──────────┬───────────┘
                               │
                          REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Express        │
                    │        Server        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌──────────┐    ┌──────────┐
        │ MongoDB  │     │   Auth   │    │ AI Service│
        │ Database │     │   JWT    │    │           │
        └──────────┘     └──────────┘    └──────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Notification     │
                    │        System        │
                    └──────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript
* Responsive UI
* REST API integration

## Backend

* Node.js
* Express.js
* REST APIs
* JWT Authentication
* Middleware
* Express Validator

## Database

* MongoDB
* Mongoose ODM

## Security

* JSON Web Tokens
* bcrypt.js
* Helmet
* CORS
* Express Rate Limit
* Input validation

## AI

* AI-powered complaint analysis
* AI service integration
* Automated complaint classification

## Additional Technologies

* Nodemailer
* Cookie Parser
* Morgan
* File Upload Middleware
* Razorpay integration where applicable

---

# 📁 Project Structure

```text
Campus-Resolve/
│
├── backend/
│   │
│   ├── controllers/
│   │   ├── complaintController.js
│   │   └── notificationController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   └── notification.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── notificationRoutes.js
│   │
│   ├── services/
│   │   └── aiService.js
│   │
│   ├── createAdmin.js
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── Procfile
│   └── .env.example
│
├── frontend/
│   └── portal.html
│
├── API.md
├── README.md
└── .gitignore
```

---

# 🔄 Complaint Workflow

The basic complaint lifecycle is:

```text
Student
   │
   ▼
Submit Complaint
   │
   ▼
AI Analysis
   │
   ▼
Complaint Categorization
   │
   ▼
Admin Review
   │
   ▼
Department Assignment
   │
   ▼
Complaint Processing
   │
   ▼
Resolution
   │
   ▼
Student Notification
```

---

# 🔐 Authentication & Authorization

Campus Resolve uses **JWT-based authentication**.

### Authentication Flow

```text
User Login
    ↓
Credentials Verification
    ↓
Password Validation
    ↓
JWT Token Generation
    ↓
Authenticated Request
    ↓
Middleware Verification
    ↓
Protected Resource
```

Different user roles can have different permissions.

Example:

```text
Student
 ├── Create Complaint
 ├── View Own Complaints
 └── Receive Notifications

Admin
 ├── View Complaints
 ├── Manage Complaints
 ├── Update Status
 ├── Assign Complaints
 └── Manage Users
```

---

# 🗄️ Database

Campus Resolve uses **MongoDB** for storing application data.

Potential collections include:

```text
Users
Complaints
Notifications
Departments
```

### Example Complaint

```json
{
  "title": "Water Cooler Not Working",
  "description": "The water cooler near the CSE department is not working.",
  "category": "Infrastructure",
  "status": "Pending",
  "priority": "Medium"
}
```

---

# 🔔 Notification System

The notification system keeps users informed about important complaint events.

Example:

```text
Complaint Submitted
        ↓
Notification Created
        ↓
Admin Processes Complaint
        ↓
Status Updated
        ↓
Student Receives Notification
```

Notifications can be extended to support:

* In-app notifications
* Email notifications
* Status update alerts
* Resolution notifications

---

# 📡 API Overview

The backend exposes RESTful APIs.

Example API structure:

```text
/api/auth
/api/complaints
/api/notifications
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Complaints

```text
POST   /api/complaints
GET    /api/complaints
GET    /api/complaints/:id
PUT    /api/complaints/:id
DELETE /api/complaints/:id
```

### Notifications

```text
GET /api/notifications
PUT /api/notifications/:id
```

For detailed API documentation, see:

`API.md`

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/itsmenikhil90/Campus-Resolve.git
```

Move into the project:

```bash
cd Campus-Resolve
```

---

# 2. Install Backend Dependencies

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

# 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/campus_resolve

JWT_SECRET=your_secret_key

FRONTEND_URL=http://localhost:5500
```

Add other required API credentials according to your configuration.

> Never commit your real `.env` file to GitHub.

---

# 4. Start the Backend

For development:

```bash
npm run dev
```

Or:

```bash
node server.js
```

The backend should run at:

```text
http://localhost:5000
```

---

# 5. Run the Frontend

Open the frontend using:

```text
frontend/portal.html
```

You can use:

* VS Code Live Server
* Any local web server
* Your preferred frontend development environment

---

# 🔑 Admin Setup

If the project contains the admin creation script:

```bash
node createAdmin.js
```

Configure the required administrator credentials before running the script.

---

# 🧪 Testing

Before deployment, test:

### Authentication

* Registration
* Login
* Invalid credentials
* JWT validation
* Protected routes

### Complaints

* Create complaint
* View complaint
* Update complaint
* Delete complaint
* Status changes
* File uploads

### Notifications

* Notification creation
* Notification retrieval
* Read/unread status

### Security

* Invalid JWT
* Unauthorized access
* Invalid input
* Rate limiting
* CORS configuration

---

# 🐳 Docker

The backend includes a `Dockerfile`.

Build the image:

```bash
docker build -t campus-resolve-backend .
```

Run the container:

```bash
docker run -p 5000:5000 campus-resolve-backend
```

Make sure the required environment variables are configured.

---

# 🌐 Deployment

The application can be deployed using services such as:

### Frontend

* Vercel
* Netlify
* GitHub Pages

### Backend

* Render
* Railway
* AWS
* Azure
* Google Cloud

### Database

* MongoDB Atlas

A typical production architecture:

```text
                 Users
                   │
                   ▼
            ┌─────────────┐
            │  Frontend   │
            │   Vercel    │
            └──────┬──────┘
                   │
                   ▼
            ┌─────────────┐
            │   Backend   │
            │   Render    │
            └──────┬──────┘
                   │
                   ▼
            ┌─────────────┐
            │   MongoDB   │
            │    Atlas    │
            └─────────────┘
```

---

# 🔒 Security Considerations

Campus Resolve implements several security practices:

* Password hashing using bcrypt
* JWT authentication
* Protected routes
* Role-based authorization
* HTTP security headers using Helmet
* Rate limiting
* CORS configuration
* Input validation
* Environment variables for secrets
* Secure API architecture

### Important

Never expose:

```text
JWT_SECRET
MongoDB credentials
API keys
Payment keys
Email passwords
AI API keys
```

in the GitHub repository.

---

# 📈 Future Improvements

Planned or possible improvements include:

* 📱 Mobile application
* 🤖 Advanced AI complaint classification
* 🧠 AI-generated complaint summaries
* 📊 Advanced analytics dashboard
* 📍 Location-based complaint management
* 📧 Automated email notifications
* 🔔 Real-time notifications using Socket.IO
* 🏢 Department-specific dashboards
* ⭐ Complaint feedback and ratings
* 📊 Resolution-time analytics
* 🔍 Advanced complaint search
* 📎 Improved document management
* 🛡️ Advanced security monitoring

---

# 🎯 Project Objectives

Campus Resolve aims to:

1. Digitize campus complaint management.
2. Reduce manual complaint processing.
3. Improve transparency.
4. Provide complaint status tracking.
5. Improve communication between students and administration.
6. Automate repetitive complaint-management tasks.
7. Use AI to assist complaint categorization and processing.
8. Maintain a centralized complaint history.

---

# 💡 Example Use Case

### Problem

A student discovers that several classroom fans are not working.

### Traditional Process

```text
Student
   ↓
Finds responsible person
   ↓
Reports issue manually
   ↓
Waits for response
   ↓
No centralized tracking
```

### Campus Resolve

```text
Student
   ↓
Creates Complaint
   ↓
AI analyzes complaint
   ↓
Category assigned
   ↓
Admin receives complaint
   ↓
Department assigned
   ↓
Issue resolved
   ↓
Student receives notification
```

---

# 📊 Benefits

### Students

* Easy complaint submission
* Transparent tracking
* Faster communication
* Centralized complaint history

### Administration

* Centralized management
* Better complaint organization
* Automated categorization
* Complaint analytics
* Improved monitoring

### Institution

* Digital workflow
* Better accountability
* Data-driven decision making
* Reduced paperwork
* Improved campus services

---

# 🧑‍💻 Development

This project is developed as a full-stack web application using modern web technologies.

The architecture is designed to be modular so that additional features can be added without significantly changing the existing system.

---

# 🤝 Contributing

Contributions are welcome.

### Step 1

Fork the repository.

### Step 2

Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/Campus-Resolve.git
```

### Step 3

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

### Step 4

Make your changes.

### Step 5

Commit:

```bash
git add .
git commit -m "Add new feature"
```

### Step 6

Push:

```bash
git push origin feature/your-feature
```

### Step 7

Open a Pull Request.

---

# 📜 License

This project is currently intended for educational and project-development purposes.

If a formal open-source license is added, this section should be updated accordingly.

---

# 👨‍💻 Author

**Nikhil Patel**

Computer Science & Engineering
Artificial Intelligence & Full-Stack Development

GitHub:
https://github.com/itsmenikhil90

---

# ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

## 🚀 Campus Resolve

**Report. Track. Resolve.**

A smarter digital approach to campus complaint management.
