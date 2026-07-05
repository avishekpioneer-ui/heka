import mongoose from "mongoose";

// Singleton document — only one record ever lives in this collection.
// The admin updates it; students read it to get payment details.
const paymentSettingsSchema = new mongoose.Schema(
    {
        accountName: { type: String, default: "" },
        bankName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifsc: { type: String, default: "" },
        upiId: { type: String, default: "" },
        qrImageUrl: { type: String, default: "" },   // optional: base64 or URL
        notes: { type: String, default: "" },         // any extra instructions for students
    },
    { timestamps: true }
);

export default mongoose.model("PaymentSettings", paymentSettingsSchema);
