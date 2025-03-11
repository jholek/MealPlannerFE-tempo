import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-700">
          Meal Planner
        </h1>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
