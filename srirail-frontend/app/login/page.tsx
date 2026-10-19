import AuthForm from "@/components/auth/AuthForm";
export const metadata = { title: "Sign in" };
export default function Page() {
  return (
    <div className="container page-section">
      <AuthForm />
    </div>
  );
}
