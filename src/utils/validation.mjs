export const createUserValidationSchema = {
    Email : {
        notEmpty: {
            errorMessage : "not empty"  
        },
        isString : {
            errorMessage : 'just string'
        },
    },
    password : {
        isString : {
            errorMessage : 'just string'
        },
        notEmpty : {
            errorMessage : 'not empty'
        },
    }
} 