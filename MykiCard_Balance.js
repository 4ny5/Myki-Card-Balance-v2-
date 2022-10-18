/*
Script: MykiCard_Balance.js
Author: George (@4ny5)
Date: 18/10/2022
Version: 2.0.0
*/
let cardNumber = args.widgetParameter

let ptvWebAuth = await getMykitoken()

let card = await getCard()

let widget = await createWidget(card)

if (!config.runsInWidget) {
    await widget.presentMedium()
}

Script.setWidget(widget)
Script.complete()

async function createWidget(card) {

    let widget = new ListWidget()

    if (card["code"] != 1) {
        let alertMessage = widget.addText(card["message"])
        alertMessage.font = new Font("AppleSDGothicNeo-bold", 15)
        alertMessage.textColor = new Color("#9c1616")
        return widget
    }

    card = card["data"][0]

    let currentTime = new Date()
    let df = new DateFormatter()
    df.useMediumDateStyle()
    df.useShortTimeStyle()
    let dateTxt = df.string(currentTime)

    let mykiBalance = card["mykiBalance"]
    let mykiBalanceValue = parseFloat(mykiBalance).toFixed(2).toString()
    let balanceSign = mykiBalance < 0 ? "- $" : "$"
    let balanceTxt = balanceSign + mykiBalance.mykiBalance
    let mykiPass = card["Product"] || []

    if (config.runsWithSiri) {
        Speech.speak("You have " + balanceTxt + " left in your Myki money!")
        if (mykiPass.length > 0) {
            Speech.speak("You have " + mykiPass[0]["daysRemaining"] + " days remaining in your Myki pass!")
        }
    }

    let passengerCode = card["passengerCode"]
    let passengerTxt = ""

    switch (passengerCode) {
        case 1: // Verified
            passengerTxt = "Full Fare"
            break;
        case 2: // Unverified
            passengerTxt = "Concession"
            break;
        case 3: // Unverified
            passengerTxt = "Child"
            break;
        case 4: // Unverified
            passengerTxt = "Senior"
            break;
        case 7: // Verified
            passengerTxt = "Student Concession"
        default:
            passengerTxt = "Full Fare"
            break;
    }


    // Set gradient background
    let startColor = new Color("#161616")
    let midColor = new Color("#161616")
    let endColor = new Color("#161616")
    let gradient = new LinearGradient()


    gradient.colors = [startColor, midColor, endColor]
    gradient.locations = [0.0, 0.72, 0.721]
    widget.backgroundGradient = gradient

    widget.addSpacer()

    let mykiTitle = widget.addStack()
    mykiTitle.centerAlignContent()

    let mykiLogo = mykiTitle.addText("•••• " + cardNumber.slice(-5,-1) + " " + cardNumber.slice(-1))
    mykiLogo.font = new Font("AppleSDGothicNeo-bold", 16)
    mykiLogo.textColor = new Color("#ffffff")
    mykiTitle.addSpacer()

    let mykiCode = mykiTitle.addText("Top Up")
    let mykiSymbol = mykiTitle.addText(">")

    mykiCode.font = new Font("AppleSDGothicNeo-bold", 20)
    mykiSymbol.font = new Font("AppleSDGothicNeo-bold", 45)

    mykiSymbol.textColor = new Color("#d92b26")
    mykiCode.textColor = new Color("#ffffff")
    mykiCode.url = "https://www.ptv.vic.gov.au/tickets/myki/#topup"

    widget.addSpacer()

    if (mykiPass.length > 0) {
        let middleViewTitle = widget.addStack()
        let moneyTitle = middleViewTitle.addText("myki money")
        moneyTitle.font = new Font("AppleSDGothicNeo-bold", 12)
        moneyTitle.textColor = new Color("#eeeeee")
        middleViewTitle.addSpacer()

        let passTitle = middleViewTitle.addText("myki pass")
        passTitle.font = new Font("AppleSDGothicNeo-bold", 12)
        passTitle.textColor = new Color("#eeeeee")
    }

    let middleView = widget.addStack()
    let balanceTitleSign = middleView.addText(balanceSign)
    balanceTitleSign.textColor = new Color("#c2d840")
    balanceTitleSign.font = new Font("AppleSDGothicNeo-Regular", 30)
    let balanceTitle = middleView.addText(mykiBalanceValue)
    balanceTitle.font = new Font("AppleSDGothicNeo-Regular", 30)
    balanceTitle.textColor = new Color("#ffffff")
    middleView.addSpacer()

    if (mykiPass.length > 0) {
        let daysRemaining = mykiPass[0]["daysRemaining"].toString()
        let daysRemainingTitle = middleView.addText(daysRemaining)
        daysRemainingTitle.font = new Font("AppleSDGothicNeo-Regular", 30)
        daysRemainingTitle.textColor = new Color("#eeeeee")
    }

    middleView.bottomAlignContent()

    widget.addSpacer()

    let bottomView = widget.addStack()

    let expireText = bottomView.addText("Expiry: ")
    expireText.textColor = new Color("#ffffff")
    expireText.font = new Font("AppleSDGothicNeo-regular", 10)

    expire_df = new DateFormatter()
    expire_df.useMediumDateStyle()
    let expireDateStr = expire_df.string(new Date(card["mykiCardExpiryDate"]))
    let expireDate = bottomView.addText(expireDateStr)
    expireDate.font = new Font("AppleSDGothicNeo-bold", 10)
    expireDate.textColor = new Color("#ffffff")
    bottomView.addSpacer()

    addSymbol({
        symbol: 'tram.fill',
        stack: bottomView,
    })
    addSymbol({
        symbol: 'tram',
        stack: bottomView,
    })
    addSymbol({
        symbol: 'bus',
        stack: bottomView,
    })
    bottomView.addSpacer()

    // Card Type = Full Fare  "example"

    let travelText = bottomView.addText("Card Type: ")
    travelText.textColor = new Color("#ffffff")
    travelText.font = new Font("AppleSDGothicNeo-regular", 10)

    let travelType = bottomView.addText(passengerTxt)
    travelType.font = new Font("AppleSDGothicNeo-bold", 10)
    travelType.textColor = new Color("#ffffff")
    widget.addSpacer()

    return widget
}


function addSymbol({
    symbol = 'applelogo',
    stack,
    color = Color.white(),
    size = 12,
}) {
    const _sym = SFSymbol.named(symbol)
    const wImg = stack.addImage(_sym.image)
    wImg.tintColor = color
    wImg.imageSize = new Size(size, size)
}

async function getMykitoken() {
    let url = "https://www.ptv.vic.gov.au/tickets/myki"
    let req = new Request(url)
    let result = await req.loadString()
    let matchToken = result.match(/"mykiToken":"([^"]+)","mykiTime":([0-9]+)+/)
    let mykiToken = matchToken[1].replace(/\\\//g, "/")
    let mykiTime = matchToken[2]
    return mykiTime + "-" + mykiToken
}

async function getCard() {
    let url = "https://mykiapi.ptv.vic.gov.au/v2/myki/card"
    let req = new Request(url)
    req.method = "POST"
    let defaultHeaders = {
        Accept: "application/json",
        "Content-Type": "application/json"
    }
    authHeader = { "x-ptvwebauth": ptvWebAuth }
    req.headers = {
        ...defaultHeaders,
        ...authHeader
    }
    let data = { "0": { "mykiCardNumber": cardNumber } }
    req.body = JSON.stringify(data)
    let result = await req.loadJSON()
    log(result)
    return result
}
