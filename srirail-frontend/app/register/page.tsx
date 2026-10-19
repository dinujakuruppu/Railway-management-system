import AuthForm from "@/components/auth/AuthForm";
export const metadata = { title: "Create an account" };
export default function Page() {
  return (
    <div className="container page-section">
      <AuthForm register />
    </div>
  );
}
