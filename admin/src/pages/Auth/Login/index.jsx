import { Mail } from "lucide-react";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import AuthWrapper from "../../../layout/AuthWrapper";
import useLoginController from "./useLoginController";

const Login = () => {

  const { values, functions } = useLoginController()

  return (
    <AuthWrapper title="Login to your account">
      <div className="flex flex-col space-y-4 items-center w-full">
        <Input
          label="Email"
          icon={Mail}
          required
          {...values?.register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Invalid email address",
            },
          })}
          error={values?.errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          required
          {...values?.register("password", {
            required: "Password is required",
          })}
          error={values?.errors.password?.message}
        />
        <div className="w-full flex items-center justify-between">
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...values?.register("rememberMe")}
              className="form-checkbox h-4 w-4 text-primary"
            />
            <span>Remember Me</span>
          </label>
          <p
            className="text-sm text-primary cursor-pointer"
            onClick={functions.onForgot}
          >
            Forgot Password?
          </p>
        </div>
        <Button rounded text="Login" onClick={functions.handleSubmit} size="lg" loading={values.isLoading} />
      </div>
    </AuthWrapper>
  );
}

export default Login;
