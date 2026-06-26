import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

async function main() {
  // Super admin - always exists, never auto-promoted
  const superAdmin = await prisma.user.upsert({
    where: { email: "user@gmail.com" },
    update: {},
    create: {
      email: "user@gmail.com",
      name: "Super Admin",
      role: "ADMIN",
      password: await bcrypt.hash("Admin123#", 10),
    },
  });

  console.log("Super admin ready:", superAdmin.email);

  // Only seed services if none exist
  const existingCount = await prisma.service.count();
  if (existingCount === 0) {
    const services = [
      { name: "Haircut & Styling", duration: 30, price: 35, description: "Professional haircut with styling" },
      { name: "Beard Trim", duration: 15, price: 20, description: "Beard shaping and trimming" },
      { name: "Hair Coloring", duration: 60, price: 80, description: "Full hair coloring service" },
      { name: "Massage Therapy", duration: 60, price: 90, description: "Relaxing full body massage" },
      { name: "Facial Treatment", duration: 45, price: 70, description: "Deep cleansing facial" },
      { name: "Dental Consultation", duration: 30, price: 50, description: "Initial dental checkup" },
      { name: "Physiotherapy Session", duration: 45, price: 85, description: "Physical therapy assessment" },
      { name: "Private Tutoring", duration: 60, price: 60, description: "One-on-one tutoring session" },
      { name: "Tax Consultation", duration: 30, price: 100, description: "Professional tax advice" },
      { name: "Laptop Repair", duration: 60, price: 75, description: "Diagnosis and repair" },
      { name: "Mobile Repair", duration: 45, price: 65, description: "Screen and hardware repair" },
      { name: "Home Cleaning", duration: 120, price: 120, description: "Full home cleaning service" },
      { name: "Pet Grooming", duration: 60, price: 55, description: "Complete pet grooming" },
      { name: "Car Wash & Detailing", duration: 90, price: 80, description: "Interior and exterior detailing" },
    ];

    for (const service of services) {
      await prisma.service.create({
        data: {
          ...service,
          active: true,
        },
      });
    }
    console.log(`Seeded ${services.length} default services`);
  } else {
    console.log(`Preserving ${existingCount} existing services`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });