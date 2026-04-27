import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BASE_URL = "https://api.coingecko.com/api/v3";


let coinsList: any[] | null = null;

const getCoinId = async ({ symbol }: { symbol: string }): Promise<any> => {
    try {
        if (!coinsList) {
            const response = await axios.get(`${BASE_URL}/coins/list`);
            coinsList = response.data;
        }

        const coin = coinsList!.find((coin: any) => coin.symbol.toLowerCase() === symbol.toLowerCase());

        if (!coin) return { error: `No coin found for this symbol: ${symbol}` }

        return {
            symbol,
            id: coin.id,
            name: coin.name,
            note: "Use this id for other crypto tool calls that take id as parameter."
        }
    } catch (err) {
        console.error("Error fetching crypto id list: ", err);

        const errorMessage = err instanceof Error ? err.message : String(err);

        return {
            toolStatus: "failed",
            description: "error while executing tool",
            errorDetails: errorMessage
        };
    }
}


const getCryptoPrice = async ({ id }: { id: string }): Promise<any> => {
    try {

        const response = await axios.get(`${BASE_URL}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`, {
            headers: {
                "x-cg-demo-api-key": COINGECKO_API_KEY,
            }
        });

        return {
            symbol: id,
            price: parseFloat(response.data.market_data.current_price.usd),
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


const getCryptoHistory = async ({ id, date }: { id: string, date: string }): Promise<any> => {
    try {
        const response = await axios.get(`${BASE_URL}/coins/${id}/history?date=${date}`, {
            headers: {
                "x-cg-demo-api-key": COINGECKO_API_KEY,
            }
        });

        return {
            coinId: id,
            date,
            historical_price: parseFloat(response.data.market_data.current_price.usd),
            currency: "USD",
            note:"histocial_price is the price of the coin on the given date."        }

    } catch (err: unknown) {

        const errorMessage = err instanceof Error ? err.message : String(err);

        return {
            toolStatus: "failed",
            description: "error while executing tool",
            errorDetails: errorMessage
        };
    }
}


export { getCryptoPrice, getCryptoHistory, getCoinId }