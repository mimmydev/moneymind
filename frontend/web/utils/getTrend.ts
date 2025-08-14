export type Trend = {
    text: string
    icon: string
    class: string
}

type TrendType =
    | "balance"
    | "transactions"
    | "expenses"
    | "savings"
    | "peakSpendingDay"
    | "dailyAverage"

export function getTrend(current: number, type: TrendType): Trend {
    let text = ""
    let icon = "iconamoon:sign-equal"
    let className = "text-neutral-400"

    if (type === "balance") {
        if (current > 300) {
            text = "You’re loaded fr fr 💰"
            icon = "mdi:cash"
            className = "text-income"
        } else if (current > 50) {
            text = "Mid-level funds, don’t wild out 🫱"
            icon = "mdi:alert"
            className = "text-warning"
        } else {
            text = "Bro... instant noodles szn 🍜"
            icon = "mdi:noodles"
            className = "text-expenses"
        }
    }

    if (type === "transactions") {
        if (current > 20) {
            text = "Shopping spree arc unlocked 🛒"
            icon = "mdi:cart"
            className = "text-expenses"
        } else if (current > 5) {
            text = "Lil bit of this, lil bit of that 📦"
            icon = "mdi:package-variant"
            className = "text-neutral-600"
        } else {
            text = "Minimalist core 🌿"
            icon = "mdi:leaf"
            className = "text-income"
        }
    }

    if (type === "expenses") {
        if (current > 500) {
            text = "Big spender vibes 💸"
            icon = "mdi:currency-usd-off"
            className = "text-expenses"
        } else if (current > 100) {
            text = "Chill but watch it 📈"
            icon = "mdi:chart-line"
            className = "text-neutral-600"
        } else {
            text = "Wallet still smiling 😊"
            icon = "mdi:wallet"
            className = "text-income"
        }
    }

    if (type === "savings") {
        if (current >= 50) {
            text = "Certified savings slayer 🐷"
            icon = "mdi:piggy-bank"
            className = "text-income"
        } else if (current >= 20) {
            text = "Not bad, keep stacking 👍"
            icon = "mdi:thumb-up"
            className = "text-neutral-600"
        } else {
            text = "Uhh… where’s the bag? 😔"
            icon = "mdi:emoticon-sad"
            className = "text-warning"
        }
    }

    if (type === "peakSpendingDay") {
        if (current > 500) {
            text = "Wallet went nuclear 💥"
            icon = "mdi:calendar-star"
            className = "text-expenses"
        } else if (current > 200) {
            text = "Full send day 🚀"
            icon = "mdi:calendar-star"
            className = "text-expenses"
        } else if (current > 0) {
            text = "Lil splurge 🛍️"
            icon = "mdi:calendar-star"
            className = "text-neutral-600"
        } else {
            text = "No damage recorded 😶"
            icon = "mdi:calendar-star"
            className = "text-neutral-400"
        }
    }

    if (type === "dailyAverage") {
        if (current > 100) {
            text = "Rich kid energy 👑"
            icon = "mdi:calendar-today"
            className = "text-expenses"
        } else if (current > 50) {
            text = "Balanced vibes 😌"
            icon = "mdi:calendar-today"
            className = "text-neutral-600"
        } else if (current > 0) {
            text = "Slow drip spending 🪙"
            icon = "mdi:calendar-today"
            className = "text-income"
        } else {
            text = "Zero spend grind 📊"
            icon = "mdi:calendar-today"
            className = "text-neutral-400"
        }
    }

    return { text, icon, class: className }
}
