"use client";

export interface ParsedTxError {
    userMessage: string;
    shouldLog: boolean;
    isUserRejected: boolean;
}

function firstLine(text: string): string {
    return text.split("\n")[0]?.trim() || text.trim();
}

export function parseTxError(
    error: unknown,
    fallbackMessage = "Transaction failed. Please try again."
): ParsedTxError {
    const name =
        typeof error === "object" && error !== null && "name" in error
            ? String((error as { name?: unknown }).name ?? "")
            : "";
    const rawMessage = error instanceof Error ? error.message : String(error ?? "");
    const combined = `${name} ${rawMessage}`.toLowerCase();

    const isUserRejected =
        combined.includes("user rejected") ||
        combined.includes("rejected the request") ||
        combined.includes("walletsigntransactionerror") ||
        combined.includes("walletsendtransactionerror");

    if (isUserRejected) {
        return {
            userMessage: "Transaction canceled in wallet.",
            shouldLog: false,
            isUserRejected: true,
        };
    }

    if (combined.includes("insufficient funds") || combined.includes("insufficient lamports")) {
        return {
            userMessage: "Insufficient SOL to pay network fees.",
            shouldLog: false,
            isUserRejected: false,
        };
    }

    const anchorMatch = rawMessage.match(/Error Message:\s*([^\n]+)/);
    const anchorMessage = anchorMatch?.[1]?.trim();
    const message = anchorMessage || firstLine(rawMessage) || fallbackMessage;

    return {
        userMessage: message,
        shouldLog: true,
        isUserRejected: false,
    };
}
