"use client";
import { Agency } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import FileUpload from "../global/fileUpload";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { NumberInput } from "@tremor/react";
import {
  deleteAgency,
  initUser,
  saveActivityLogsNotification,
  updateAgencyDetails,
  upsertAgency,
} from "@/lib/queries";
import { Button } from "../ui/button";
import Loading from "../global/loading";
import { v4 } from "uuid";

type Props = {
  data?: Partial<Agency>;
};

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Agency name must be at least 2 characters long.",
  }),
  companyEmail: z.string().min(2),
  companyPhone: z.string().min(2),
  whiteLabel: z.boolean(),
  address: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(2),
  country: z.string().min(2),
  agencyLogo: z.string().min(1),
});

const AgencyDetails = ({ data }: Props) => {
  const router = useRouter();
  const [deleteingAgency, setDeletingAgency] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: "onChange",
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: data?.name ?? "",
      companyEmail: data?.companyEmail ?? "",
      companyPhone: data?.companyPhone ?? "",
      whiteLabel: data?.whiteLabel ?? false,
      address: data?.address ?? "",
      city: data?.city ?? "",
      state: data?.state ?? "",
      zipCode: data?.zipCode ?? "",
      country: data?.country ?? "",
      agencyLogo: data?.agencyLogo ?? "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data]);

  const handleSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      let newUserData;
      if (data?.id) {
        const bodyData = {
          email: values.companyEmail,
          name: values.name,
          shipping: {
            address: {
              line1: values.address,
              city: values.city,
              state: values.state,
              postal_code: values.zipCode,
              country: values.country,
            },
            name: values.name,
          },
          address: {
            line1: values.address,
            city: values.city,
            state: values.state,
            postal_code: values.zipCode,
            country: values.country,
          },
        };
      }

      newUserData = await initUser({
        role: "AGENCY_OWNER",
      });

      if (!data?.id) {
        const agencyId = v4();

        await upsertAgency({
          id: agencyId,
          name: values.name,
          companyEmail: values.companyEmail,
          companyPhone: values.companyPhone,
          whiteLabel: values.whiteLabel,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: values.country,
          agencyLogo: values.agencyLogo,
          createdAt: new Date(),
          updatedAt: new Date(),
          connectAccountId: "",
          goal: 5,
        });

        await initUser({
          role: "AGENCY_OWNER",
        });
      } else {
        const agencyId = v4();
        await upsertAgency({
          id: agencyId,
          name: values.name,
          companyEmail: values.companyEmail,
          companyPhone: values.companyPhone,
          whiteLabel: values.whiteLabel,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: values.country,
          agencyLogo: values.agencyLogo,
          createdAt: new Date(),
          updatedAt: new Date(),
          connectAccountId: "",
          goal: 5,
        });

        // Set agency ID for the user
        newUserData = await initUser({
          role: "AGENCY_OWNER",
          agencyId: agencyId, // Add agency ID here
        });
      }
      toast.success("Agency created successfully 😊");
      router.refresh();
    } catch (error) {
      console.error("Error saving agency details:", error);
      toast.error("Failed to save agency details. Please try again.");
    }
  };

  const handleDeleteAgency = async () => {
    if (!data?.id) return;
    setDeletingAgency(true);
    try {
      const response = await deleteAgency(data.id);

      toast.success("Agency deleted successfully.");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete agency. Please try again.");
    }
    setDeletingAgency(false);
  };

  return (
    <AlertDialog>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
          <CardDescription>
            Let's create an agency for you business. You can edit agency
            settings later from the agency settings tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className=" space-y-4"
            >
              <FormField
                disabled={isLoading}
                control={form.control}
                name="agencyLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency Logo</FormLabel>
                    <FormControl>
                      <FileUpload
                        apiEndpoint="agencyLogo"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                disabled={isLoading}
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Agency Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Agency Name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex md:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Agency Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Agency Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Agency Phone Number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                disabled={isLoading}
                control={form.control}
                name="whiteLabel"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border gap-4 p-4">
                      <div>
                        <FormLabel className="mb-1.5">
                          Whitelabel Agency
                        </FormLabel>
                        <FormDescription>
                          Turning on whitelabel mode will show your agency logo
                          to all sub accounts by default. <br /> You can
                          overwrite this functionality through sub account
                          settings.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />

              <div className="flex md:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 st..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="country name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex md:flex-row gap-4">
                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="city" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="state" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  disabled={isLoading}
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="zip code" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {data?.id && (
                <div className="flex flex-col gap-2">
                  <FormLabel>Create a Goal</FormLabel>
                  <FormDescription>
                    ✨ Create a goal for your agency. As your business grows
                    your goals grow too so dont forget to set the bar higher!
                  </FormDescription>
                  <NumberInput
                    defaultValue={data?.goal}
                    onValueChange={async (val) => {
                      if (!data?.id) return;
                      await updateAgencyDetails(data.id, { goal: val });
                      await saveActivityLogsNotification({
                        agencyId: data.id,
                        description: `Updated agency goal to | $${val} Subaccounts`,
                        subaccountId: undefined,
                      });
                      router.refresh();
                    }}
                    min={1}
                    className="bg-background !border !border-input rounded-lg"
                    placeholder="Sub accounts Goal"
                  />
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loading /> : "Save Agency Details"}
              </Button>
            </form>
          </Form>

          {data?.id && (
            <div className="flex flex-col items-start rounded-lg border border-destructive bg-destructive/10 gap-3 p-4 mt-4">
              <div>
                <div>Danger Zone</div>
              </div>
              <div className="text-muted-foreground">
                Deleting your agency cannot be un done. This will also delete
                all sub accounts and all data related to your sub accounts. Sub
                accounts will no longer have access to funnels, contacts etc.
              </div>
              <AlertDialogTrigger
                className=" text-red-600 border border-red-600 p-2 text-center rounded-md
           hover:bg-red-600 hover:text-white transition-colors whitespace-nowrap"
              >
                {deleteingAgency ? "Deleting..." : " Delete Agency"}
              </AlertDialogTrigger>
            </div>
          )}

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-left">
                Are you sure you want to delete this agency?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                This action cannot be undone. All data related to this agency
                will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className=" flex items-center">
              <AlertDialogCancel className=" mb-2">Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteingAgency}
                className="bg-destructive hover:bg-destructive"
                onClick={handleDeleteAgency}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </CardContent>
      </Card>
    </AlertDialog>
  );
};

export default AgencyDetails;
