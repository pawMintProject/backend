


export const CollectOrderProduct = async (dataList) => {
    if (Array.isArray(dataList)) {

        dataList = dataList.map(el => {
            let prices = 0
            let count = 0
            let sendPrice = 0
            let fee = 0
            el?.orderProduct?.forEach(element => {

                prices += element.price
                count += element.count
                fee += element.fee
                sendPrice += element.sendPrice
            });
            el["orderProductData"] = { prices, count, sendPrice, fee,finalCost: prices + fee + sendPrice  }
            return el
        })

        return dataList
    } else {
        let prices = 0
        let count = 0
        let sendPrice = 0
        let fee = 0
        dataList?.orderProduct?.forEach(element => {

            prices += element.price
            count += element.count
            fee += element.fee
            sendPrice += element.sendPrice
        });
        dataList["orderProductData"] = { prices, count, sendPrice, fee, finalCost: prices + fee + sendPrice }
        return dataList

    }
}