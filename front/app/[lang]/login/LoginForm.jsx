import { login } from "@/app/actions/login";
import { redirect } from "next/navigation";
import { useFormState } from "next/forms";

export default async function LoginForm({ lang, intl }) {
  const [state, formAction] = useFormState(login);
  if (state?.success) {
    redirect(`/${lang}/`);
  }

  return (
    <div className="mt-8 w-full max-w-sm">
      <form onSubmit={formAction} className="max-w-screen md:max-w-sm w-full">
        <div className="mb-4">
          <input
            type="text"
            name="username"
            placeholder={intl.login.username}
            className="text-sand bg-blackamber border border-sand rounded-lg w-full px-8 py-3 transition-all duration-300"
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            name="password"
            placeholder={intl.login.password}
            className="text-sand bg-blackamber border border-sand rounded-lg w-full px-8 py-3 transition-all duration-300"
            required
          />
        </div>

        {state?.error && (
          <p className="text-red-500 text-xs italic mb-4">{state.error}</p>
        )}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-blackamber bg-sand border border-sand hover:bg-pearl transition-all duration-300 cursor-pointer"
          >
            {intl.login.loginbtn}
          </button>
        </div>
      </form>
    </div>
  );
}
