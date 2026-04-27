import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const COINCAP_API_KEY = process.env.COINCAP_API_KEY;

const getCryptoPrice = async ({ crypto }: { crypto: string }): Promise<any> => {
    try {

        const response = await axios.get(`https://rest.coincap.io/v3/price/bysymbol/${crypto}`, {
            headers: {
                Authorization: `Bearer ${COINCAP_API_KEY}`,
            }
        });

        return {
            symbol: crypto,
            price: parseFloat(response.data.data[0]),
            currency: "USD",
            note: "the price is in USD"
        }

    } catch (err: unknown) {
        console.error("Error fetching crypto price: ", err);
        
        const errorMessage = err instanceof Error ? err.message : String(err);

        return {
            toolStatus: "failed",
            description: "error while executing tool",
            errorDetails: errorMessage
        };
    }
};


const getCryptoHistory = async ({ slug }: { slug: string }): Promise<any> => {
    try {
        const response = await axios.get(`https://rest.coincap.io/v3/assets/${slug}/marketcap-history`, {
            headers: {
                Authorization: `Bearer ${COINCAP_API_KEY}`,
            }
        });

        return {
            slug: slug,
            history: response.data.data.slice(0, 30),
            currency: "USD",
            note: "history is an array that contains the recent 30 history data points available for the slug. Present a summary or trend. Do not present raw numbers.",
        }

    } catch (err: unknown) {
        console.error("Error fetching slug history: ", err);

        const errorMessage = err instanceof Error ? err.message : String(err);

        return {
            toolStatus: "failed",
            description: "error while executing tool",
            errorDetails: errorMessage
        };
    }
}




export { getCryptoPrice, getCryptoHistory }