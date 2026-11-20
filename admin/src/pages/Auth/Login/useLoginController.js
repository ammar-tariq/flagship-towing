import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { requestForToken } from "../../../configs/firebase";
import { useLoginMutation } from "../../../redux/Apis/Auth";
import { insertAuthData } from "../../../utils/storage";
import { pickAccessToken, pickRefreshToken } from "../../../utils/authTokens";

const useLoginController = () => {

    const navigate = useNavigate()
    const rememberMeRef = useRef(false)

    const [login, { data, isLoading, isSuccess }] = useLoginMutation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues
    } = useForm({ defaultValues: { rememberMe: false } });

    useEffect(() => {
        if (isSuccess) {
            const remember = rememberMeRef.current
            const access = pickAccessToken(data)
            const refresh = pickRefreshToken(data)
            insertAuthData(data?.data, "user", remember)
            if (access) {
                insertAuthData(access, "access_token", remember)
            }
            if (refresh) {
                insertAuthData(refresh, "refresh_token", remember)
            }
            navigate("/users")
        }
    }, [isSuccess, data, navigate])

    const onForgot = () => navigate("/forgot-password", { state: { email: getValues("email") } })

    const onSubmit = async (formData) => {

        rememberMeRef.current = !!formData.rememberMe

        let fcm_token = await requestForToken()

        const { rememberMe, ...credentials } = formData

        login({
            ...credentials,
            fcm_token
        })

    };

    return {
        values: {
            register,
            errors,
            isLoading
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            onForgot,
        },
    };
};


export default useLoginController;