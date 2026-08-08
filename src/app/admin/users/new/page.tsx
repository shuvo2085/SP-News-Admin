import { CreateUserForm } from "@/components/admin/CreateUserForm";

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Create User</h1>
        <p className="text-muted mt-1">Add a new team member</p>
      </div>
      <CreateUserForm />
    </div>
  );
}
