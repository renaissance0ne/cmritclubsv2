import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

// This function gets the user from Clerk's session
const getUser = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId };
}

// Define the file router. We're creating one for PDF uploads.
export const ourFileRouter = {
  // Define an endpoint for PDF uploads up to 4MB
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    // Set permissions and run auth logic on the server
    .middleware(async () => {
      // This code runs on your server before upload
      const user = await getUser();
      // Whatever is returned here is accessible in onUploadComplete
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      // You can add logic here, e.g., saving the file URL to the database
      // But we will handle that in the onboarding form action itself.
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;