"use server";

import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import prisma from "./db";
import { redirect } from "next/navigation";
import { Agency, Plan, User } from "@prisma/client";

export const getAuthUserDetails = async () => {
  const user = await currentUser();
  if (!user) {
    return null;
  }

  const userData = await prisma.user.findUnique({
    where: {
      email: user.emailAddresses[0]?.emailAddress,
    },
    include: {
      Agency: {
        include: {
          SidebarOptions: true,
          SubAccount: {
            include: {
              SidebarOption: true,
            },
          },
        },
      },
      Permissions: true,
    },
  });
  return userData;
};

export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subaccountId,
}: {
  agencyId?: string;
  description: string;
  subaccountId?: string;
}) => {
  const authUser = await currentUser();
  let userData;
  if (!authUser) {
    const response = await prisma.user.findFirst({
      where: {
        Agency: {
          SubAccount: {
            some: {
              id: subaccountId,
            },
          },
        },
      },
    });
    if (response) {
      userData = response;
    }
  } else {
    userData = await prisma.user.findUnique({
      where: {
        email: authUser?.emailAddresses[0]?.emailAddress,
      },
    });
  }

  if (!userData) {
    console.log("No user found for activity log");
    return;
  }

  let foundAgencyId = agencyId;
  if (!foundAgencyId) {
    if (!subaccountId) {
      throw new Error("Either agencyId or subaccountId must be provided");
    }
    const response = await prisma.subAccount.findUnique({
      where: { id: subaccountId },
    });
    if (response) {
      foundAgencyId = response.agencyId;
    }
  }
  if (subaccountId) {
    await prisma.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        SubAccount: {
          connect: {
            id: subaccountId,
          },
        },
      },
    });
  } else {
    await prisma.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
      },
    });
  }
};

export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") {
    return null;
  }
  const response = await prisma.user.create({
    data: {
      ...user,
    },
  });

  return response;
};

export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();
  if (!user) {
    return redirect("/sign-in");
  }

  const invitationExists = await prisma.invitation.findUnique({
    where: {
      email: user.emailAddresses[0]?.emailAddress,
      status: "PENDING",
    },
  });

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: user.imageUrl,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveActivityLogsNotification({
      agencyId: invitationExists.agencyId,
      description: `Joined`,
      subaccountId: undefined,
    });

    if (userDetails) {
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || "SUBACCOUNT_USER",
        },
      });

      await prisma.invitation.delete({
        where: {
          email: user.emailAddresses[0]?.emailAddress,
        },
      });

      console.log("Invitation accepted and user created:", userDetails);
      return userDetails.agencyId;
    } else {
      return null;
    }
  } else {
    const agency = await prisma.user.findUnique({
      where: {
        email: user.emailAddresses[0]?.emailAddress,
      },
    });
    console.log("agency", agency?.agencyId, agency?.id, agency);
    return agency ? agency.agencyId : null;
  }
};

export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>
) => {
  const response = await prisma.agency.update({
    where: { id: agencyId },
    data: {
      ...agencyDetails,
    },
  });
  return response;
};

export const deleteAgency = async (agencyId: string) => {
  const response = await prisma.agency.delete({
    where: { id: agencyId },
  });
  return response;
};

export const initUser = async (newUser: Partial<User>) => {
  console.log("init user:", newUser);

  const user = await currentUser();
  if (!user) {
    return null;
  }

  const userData = await prisma.user.upsert({
    where: {
      email: user.emailAddresses[0]?.emailAddress,
    },
    update: {
      ...newUser,
      agencyId: newUser.agencyId || undefined,
    },
    create: {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      avatarUrl: user.imageUrl,
      role: newUser.role || "SUBACCOUNT_USER",
      agencyId: newUser.agencyId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("User data after upsert:", userData);

  await clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: {
      role: userData.role || "SUBACCOUNT_USER",
    },
  });

  return userData;
};

export const upsertAgency = async (agency: Agency, price?: Plan) => {
  console.log("upsert Agency:", agency);

  if (!agency.companyEmail) {
    return null;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const agencyDetails = await tx.agency.upsert({
        where: { id: agency.id },
        update: agency,
        create: {
          users: {
            connect: { email: agency.companyEmail },
          },
          ...agency,
          SidebarOptions: {
            create: [
              {
                name: "Dashboard",
                icon: "category",
                link: `/agency/${agency.id}`,
              },
              {
                name: "Launchpad",
                icon: "clipboard",
                link: `/agency/${agency.id}/launchpad`,
              },
              {
                name: "Billing",
                icon: "payment",
                link: `/agency/${agency.id}/billing`,
              },
              {
                name: "Settings",
                icon: "settings",
                link: `/agency/${agency.id}/settings`,
              },
              {
                name: "Sub Accounts",
                icon: "person",
                link: `/agency/${agency.id}/all-subaccounts`,
              },
              {
                name: "Team",
                icon: "shield",
                link: `/agency/${agency.id}/team`,
              },
            ],
          },
        },
      });

      // Update user's agencyId after agency creation
      await tx.user.update({
        where: { email: agency.companyEmail },
        data: { agencyId: agencyDetails.id, role: "AGENCY_OWNER" },
      });

      return agencyDetails;
    });
  } catch (error) {
    console.error("Error upserting agency:", error);
    throw new Error("Failed to upsert agency");
  }
};
