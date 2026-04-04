# VIT HEALTH SYNC 🏥
**A Centralized Digital Health Management Platform for Educational Institutions**

---

## 📑 Project Overview
College medical systems often struggle with fraudulent medical leaves, fragmented health records, and poor communication between stakeholders. **VIT Health Sync** (The Multi-User Medical Log project) is a role-based digital solution designed to bridge these gaps. It provides a secure, transparent, and efficient workflow for managing student health and academic medical permissions.

---

## 👥 Project Team
**Supervisor:** Dr. Sandeep Monga  

| Name | Registration Number |
| :--- | :--- |
| **Aditya Singh** | 24BCE10249 |
| **Raunak Rai** | 24BCE11366 |
| **Gauri Nandwana** | 24BCE10245 |
| **Priyamwada Tiwari** | 24BCE11480 |
| **Ronit Mehta** | 23BCE10513 |

---

## 🎯 Purpose & Goals
* **Eliminate Fraud:** Authenticated medical leave verification by certified doctors.
* **Centralized Records:** Accessible and secure history of student health logs.
* **Seamless Communication:** Real-time updates between Students, Parents, Doctors, and Faculty.
* **Workflow Automation:** Structured approval hierarchy for medical permissions.

---

## ⚙️ Methodology & Architecture
The system employs a **Multi-User Architecture** with four distinct roles:

1.  **Student:** Submit leave requests and view personal health history.
2.  **Doctor:** Perform medical verification and provide digital logs.
3.  **Faculty/Proctor:** Review and grant academic approval for verified leaves.
4.  **Parent:** Monitor student health status and leave updates.

### Design Aesthetic
* **Theme:** Professional Teal and Slate palette.
* **Typography:** Inter and Outfit fonts for high readability.
* **UI Features:** Modern Glassmorphism, elevated card shadows, and responsive navigation.

---

## 🛠️ Technology Stack
* **Frontend:** React.js (with CSS Glassmorphism & Inter Typography)
* **Backend:** Node.js & Express.js
* **Database:** MongoDB (MERN Stack)
* **State Management:** JSON Web Tokens (JWT) for Role-based Access Control

---

## 🚀 Installation & Local Setup

To run **VIT Health Sync** on your local machine, follow these steps:

1. **Clone the Repository**
   ```Terminal
   git clone https://github.com/aawwdi/VIT-HEALTH-SYNC 
   cd vit-health-sync```

2.**Install Dependencies**
   ```Terminal
   npm install
```
3. ** run on local server**
   ```Terminal
   npm run dev
   ```
click on the local port of 5000
the web app is ready to run 

## 🔑 Test Login Credentials
For the project exhibition, use the following credentials to test different user roles and the approval workflow:

### **Proctors (Faculty)**
| Name | Employee ID | Password |
| :--- | :--- | :--- |
| Prof. Sandeep Moonga | 26BCE4078 | 12345 |
| Prof. Ramesh Kumar | 26BCE4080 | 12345 |
| Prof. Meena Pillai | 26BCE4082 | 12345 |

### **Students & Linked Accounts**
| Student Name | Reg No | Password | Parent Email | Proctor ID |
| :--- | :--- | :--- | :--- | :--- |
| **Aditya Singh** | 24BCE10249 | 12345 | gargn3250@gmail.com | 26BCE4078 |
| **Riya Kapoor** | 24BCE10301 | 12345 | kapoor.riya.parent@gmail.com | 26BCE4078 |
| **Karan Mehta** | 24BCE10312 | 12345 | mehta.karan.parent@gmail.com | 26BCE4080 |
| **Ishita Sharma** | 24BCE10323 | 12345 | sharma.ishita.parent@gmail.com | 26BCE4080 |
| **Dev Patel** | 24BCE10334 | 12345 | patel.dev.parent@gmail.com | 26BCE4082 |
| **Shreya Nair** | 24BCE10345 | 12345 | nair.shreya.parent@gmail.com | 26BCE4082 |
