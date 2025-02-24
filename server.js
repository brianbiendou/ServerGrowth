import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";
import { url } from "inspector";

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4242;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});

app.use(cors());
app.use(express.json());

// Route pour créer une session de paiement
app.post("/create-checkout-session", async (req, res) => {
    try {
      const { itemsCheckout, customerName, currency } = req.body;  // Recevoir la devise depuis le frontend
      console.log("items", itemsCheckout);
  
      if (!itemsCheckout || !Array.isArray(itemsCheckout)) {
        return res.status(400).json({ error: "Invalid items data" });
      }
  
      // Créer la session de paiement Stripe avec la devise envoyée par le frontend
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: itemsCheckout.map((item) => ({
          price_data: {
            currency: currency,  // Utiliser la devise envoyée
            product_data: { name: item.name },
            unit_amount: item.price, // Prix en centimes
          },
          quantity: item.quantity || 1,
        })),
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/cart`,
        metadata: {
          customerName,
          items: JSON.stringify(itemsCheckout),
        },
      });
  
      res.json({ id: session.id, url: session.url });
    } catch (error) {
      console.error("Erreur lors de la création de la session Stripe:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  
// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });