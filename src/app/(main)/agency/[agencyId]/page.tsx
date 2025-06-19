import React from "react";

const Page = async ({ params }: { params: Promise<{ agencyId: string }> }) => {
  const { agencyId } = await params;
  console.log("Agency ID:", agencyId);
  return <div>{agencyId}</div>;
};

export default Page;
