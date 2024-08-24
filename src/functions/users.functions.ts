import mongoose from "mongoose";

type Role = "ADMIN" | "SUPER_ADMIN" | "CUSTOMER" | "EMPLOYEE" | "USER";
export default function applyRoleFilter({
  isShomes,
  role,
  filterArgs,
}: {
  isShomes: boolean;
  role: Role;
  filterArgs: mongoose.PipelineStage[];
}) {
  if (!isShomes) return;

  const roleFilters: Record<Role, { role: string }[]> = {
    ADMIN: [
      { role: "SUPER_ADMIN" },
      { role: "CUSTOMER" },
      { role: "EMPLOYEE" },
      { role: "USER" },
    ],
    SUPER_ADMIN: [
      { role: "ADMIN" },
      { role: "CUSTOMER" },
      { role: "EMPLOYEE" },
      { role: "USER" },
    ],
    CUSTOMER: [{ role: "EMPLOYEE" }],
    EMPLOYEE: [{ role: "ADMIN" }, { role: "CUSTOMER" }, { role: "USER" }],
    USER: [{ role: "EMPLOYEE" }],
  };

  if (role && role in roleFilters) {
    filterArgs.push({
      $match: {
        $or: roleFilters[role],
      },
    });
  } else {
    console.log("No access");
  }
}
