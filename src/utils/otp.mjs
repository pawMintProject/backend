import { KavenegarApi } from "kavenegar";
import crypto from "crypto"
const otpStore = {};

const generateOtp = () => {
    return crypto.randomInt(1000, 9999).toString();
}

const sendOtp = async (phoneNumber) => {
    const otp = generateOtp();
    otpStore[phoneNumber] = { otp, expires: Date.now() + 2 * 60 * 1000 };



    const otpApi = KavenegarApi({
        apikey: '4E6E2B676858626D61446D58324A2F7A6B41475361326153775766505774724447616147742B2F476450413D',
    });

    const i =  await otpApi.Send({
        message: `کد تایید : ${otp}`,
        sender: "2000660110",
        receptor: phoneNumber,
    })
    console.log(i)
    
}

export default sendOtp