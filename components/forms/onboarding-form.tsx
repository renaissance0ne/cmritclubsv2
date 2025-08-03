"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UploadButton, UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
  rollNumber: z.string().min(10, { message: "Please enter a valid roll number." }),
  college: z.string().min(1, { message: "Please select your college." }),
  department: z.string().min(2, { message: "Department is required." }),
  yearOfStudy: z.string(),
  expectedGraduation: z.date(),
  clubName: z.string().min(2, { message: "Club name must be at least 2 characters." }),
  facultyInCharge: z.string().min(2, { message: "Faculty name must be at least 2 characters." }),
  proofLetterUrl: z.string().min(1, { message: "Please upload your proof letter." }),
});

type OnboardingFormValues = z.infer<typeof formSchema>;

export function OnboardingForm() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      rollNumber: "",
      college: "",
      department: "",
      yearOfStudy: "1",
      expectedGraduation: new Date(),
      clubName: "",
      facultyInCharge: "",
      proofLetterUrl: "",
    },
  });

  async function onSubmit(values: OnboardingFormValues) {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          yearOfStudy: parseInt(values.yearOfStudy, 10),
          expectedGraduation: values.expectedGraduation.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'An unknown error occurred');
      }

      router.push('/pending-approval');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rollNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roll Number</FormLabel>
                <FormControl>
                  <Input placeholder="21R21A0501" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="college"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cmrit">CMR Institute of Technology</SelectItem>
                      <SelectItem value="cmrcet">CMR College of Engineering & Technology</SelectItem>
                      <SelectItem value="cmrtc">CMR Technical Campus</SelectItem>
                      <SelectItem value="cmrec">CMR Engineering College</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Computer Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearOfStudy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year of Study</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your year of study" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expectedGraduation"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expected Graduation Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date("2030-01-01") || date < new Date("2024-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clubName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Club Name</FormLabel>
                <FormControl>
                  <Input placeholder="Tech Geeks Club" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="facultyInCharge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Faculty In-Charge Name</FormLabel>
                <FormControl>
                  <Input placeholder="Dr. Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="proofLetterUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Letter of Proof (PDF)</FormLabel>
              <FormControl>
                <div className="flex flex-col items-center justify-center w-full">
                  {!uploadedFileName ? (
                    <UploadButton<OurFileRouter, "pdfUploader">
                      endpoint="pdfUploader"
                      onClientUploadComplete={(res) => {
                        console.log("Upload complete:", res);
                        if (res && res[0]) {
                          form.setValue("proofLetterUrl", res[0].ufsUrl);
                          setUploadedFileName(res[0].name);
                          console.log("File URL set:", res[0].ufsUrl);
                        }
                        setUploadProgress(0);
                      }}
                      onUploadError={(error: Error) => {
                        console.error("Upload error:", error);
                        alert(`ERROR! ${error.message}`);
                        setUploadProgress(0);
                      }}
                      onUploadBegin={(name) => {
                        console.log("Upload started:", name);
                        setUploadProgress(1);
                      }}
                      onUploadProgress={(progress) => {
                        console.log("Upload progress:", progress);
                        setUploadProgress(progress);
                      }}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full text-center">
                      <p className="text-green-600 mb-2">✓ File uploaded successfully!</p>
                      <p className="text-sm text-gray-600 mb-4">{uploadedFileName}</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          form.setValue("proofLetterUrl", "");
                          setUploadedFileName(null);
                        }}
                      >
                        Upload Different File
                      </Button>
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && !uploadedFileName && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      <p className="text-sm text-gray-600 mt-1 text-center">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
        </Button>
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      </form>
    </Form>
  );
}
