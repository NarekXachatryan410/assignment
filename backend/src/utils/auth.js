import { GraphQLError } from "graphql";

export function requireAuth(user) {
    if(!user) {
        throw new GraphQLError("Unathorized")
    }
    return true
}