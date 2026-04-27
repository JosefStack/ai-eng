import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const COINCAP_API_KEY = process.env.COINCAP_API_KEY;

const getCryptoPrice = async (crypto: string): Promise<any> => {
    try {

        const response = await axios.get(`https://rest.coincap.io/v3/price/bysymbol/${crypto}`, {
            headers: {
                Authorization: `Bearer ${COINCAP_API_KEY}`,
            }
        });

        // return parseFloat(response.data.data[0]);
        return {
            symbol: crypto,
            price: parseFloat(response.data.data[0]),
            currency: "USD",
            note: "the price is in USD"
        }

    } catch (error) {
        console.error("Error fetching crypto price:", error);
        throw error;
    }
};

export { getCryptoPrice };

