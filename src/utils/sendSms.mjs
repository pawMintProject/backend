import axios from "axios";


 export const SendSms =async(phone,token)=>await axios.get(`https://api.kavenegar.com/v1/4E6E2B676858626D61446D58324A2F7A6B41475361326153775766505774724447616147742B2F476450413D/sms/send.json?receptor=${phone}&sender=100010001142&message=${token}`)