import alert from "../assets/alert.svg";
import circle from "../assets/circle.svg";
import clock from "../assets/clock.svg";
import device from "../assets/device.svg";
import file from "../assets/file.svg";
import security from "../assets/security.svg";
import chart from "../assets/chart.svg";
import step from "../assets/step.svg";
import check from "../assets/check.svg";
import star from "../assets/star.svg";
import beach1 from "../assets/beach1.jpg";
import beach2 from "../assets/beach2.jpg";
import beach3 from "../assets/beach3.jpg";

export const listData = [
  {
    image: clock,
    text: "Wasting 2+ hours daily on manual record-keeping",
  },
  {
    image: alert,
    text: "Losing money from missing or damaged paper records",
  },
  {
    image: circle,
    text: "Unable to track profits or make data-driven decisions",
  },
];

export const listData2 = [
  {
    image: file,
    title: "Automated Receipt Generation",
    description:
      "Professional receipts generated instantly with every sale. Print or download as PDF. No more handwriting.",
  },
  {
    image: device,
    title: "Works on Any Device",
    description:
      "Access from your phone, tablet, or computer. No special hardware needed. Just a web browser.",
  },
  {
    image: chart,
    title: "Real-Time Dashboard",
    description:
      "Track daily sales, expenses, and profit as they happen. See your business performance at a glance.",
  },
  {
    image: security,
    title: "Role-Based Security",
    description:
      "Add workers and assign roles: Owner, Manager, or Cashier. Control who sees what information.",
  },
];

export const listData3 = [
  {
    image: step,
    title: "Sign Up Free",
    description: "Register your business in under 2 minutes",
  },
  {
    image: step,
    title: "Record Transactions",
    description: "Enter sales on any device, receipts generate automatically",
  },
  {
    image: step,
    title: "Track & Export",
    description: "View real-time dashboard and download reports anytime",
  },
];

export const listData4 = [
  {
    number: "60%",
    title: "Time Saved",
    description: "On daily record-keeping tasks",
  },
  {
    number: "99%",
    title: "Accuracy Rate",
    description: "Eliminate calculation errors",
  },
  {
    number: "$0/year",
    title: "Affordable",
    description: "Entirely free with premuim features",
  },
];

export const listData5 = [
  {
    image: check,
    description: "Multi-item transaction entry",
  },
  {
    image: check,
    description: "Automatic total calculations",
  },
  {
    image: check,
    description: "Transaction history & search",
  },
  {
    image: check,
    description: "Expense tracking module",
  },
  {
    image: check,
    description: "PDF & CSV data exports",
  },
  {
    image: check,
    description: "Worker invitation system",
  },
];

export const listData6 = [
  {
    star : star,
    description : "I used to spend 2 hours every evening writing receipts and tallying sales. Now it takes 10 minutes. Game changer!",
    image: beach1,
    name : 'Mary K.',
    location : 'SHOP OWNER, ACCRA',
  },
   {
    star : star,
    description : "My workers can now enter orders directly, and receipts print automatically. Customers love how professional we look.",
    image: beach2,
    name : 'James O.',
    location : 'RESTAURANT SHOP, LAGOS',
  },
  {
     star : star,
     description : "Finally I know exactly how much profit I'm making each day. The dashboard shows everything I need.",
     image : beach3,
     name : 'Sarah M.',
     location : 'MARKET VENDOR, NAIROBI'
  }
]

export const listData7 = [
  {
    description : "No! KoboTrack works in any modern web browser on your phone, tablet, or laptop. You can print to standard desktop printers or Bluetooth thermal receipt printers if you choose."
  },
  {
    description : "KoboTrack requires an internet connection to sync data securely. However, the app is optimized to work even on slow 2G/3G connections commonly found in markets."
  },
  {
    description : "You can invite workers via their email or phone number. You assign them a role (Manager or Cashier), which controls what data they can see and edit."
  },
  {
    description : "Yes, you can export your entire transaction history and expense reports at any time in PDF or CSV (Excel) formats."
  },
  {
    description : "Currently, the service is entirely free and includes unlimited transactions per month."
  }
]

console.log(listData7[0].description);