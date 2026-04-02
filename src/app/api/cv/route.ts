import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const CV_DIR = path.join(process.cwd(), "public", "cv");

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "cvPath" },
    });

    if (!setting) {
      return Response.json({ exists: false });
    }

    const filename = path.basename(setting.value);
    return Response.json({
      exists: true,
      filename,
      path: setting.value,
    });
  } catch (error) {
    console.error("GET /api/cv error:", error);
    return Response.json({ error: "Failed to fetch CV info" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Ensure the cv directory exists
    await mkdir(CV_DIR, { recursive: true });

    // Remove old CV if it exists
    const existingSetting = await prisma.setting.findUnique({
      where: { key: "cvPath" },
    });
    if (existingSetting) {
      const oldFilePath = path.join(process.cwd(), "public", existingSetting.value);
      try {
        await unlink(oldFilePath);
      } catch {
        // Old file may not exist, that's fine
      }
    }

    // Save the new file
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CV_DIR, sanitizedName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Store the path in settings
    const cvPath = `/cv/${sanitizedName}`;
    await prisma.setting.upsert({
      where: { key: "cvPath" },
      update: { value: cvPath },
      create: { key: "cvPath", value: cvPath },
    });

    return Response.json({
      exists: true,
      filename: sanitizedName,
      path: cvPath,
    });
  } catch (error) {
    console.error("POST /api/cv error:", error);
    return Response.json({ error: "Failed to upload CV" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "cvPath" },
    });

    if (!setting) {
      return Response.json({ error: "No CV to delete" }, { status: 404 });
    }

    // Delete the file
    const filePath = path.join(process.cwd(), "public", setting.value);
    try {
      await unlink(filePath);
    } catch {
      // File may already be gone
    }

    // Remove the setting
    await prisma.setting.delete({ where: { key: "cvPath" } });

    return Response.json({ exists: false });
  } catch (error) {
    console.error("DELETE /api/cv error:", error);
    return Response.json({ error: "Failed to delete CV" }, { status: 500 });
  }
}
