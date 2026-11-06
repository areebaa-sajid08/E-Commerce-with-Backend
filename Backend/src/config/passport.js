import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import env from "./env.js"
import userModel from "../models/users.model.js"
import { ROLES } from "./constants.js"
import { announceAccountCreated } from "../realtime.js"

async function uniqueUsername(email, name) {
    const base = (email.split("@")[0] || name || "user").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "user"
    let candidate = base
    while (await userModel.exists({ username: candidate })) {
        candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`
    }
    return candidate
}

export function setupPassport() {
    if (!env.googleEnabled) {
        console.warn("Google sign-in is off (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable it)")
        return
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: env.googleClientId,
                clientSecret: env.googleClientSecret,
                callbackURL: env.googleCallbackUrl,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const entry = profile.emails?.[0]
                    const email = entry?.value?.toLowerCase()
                    const verified = entry?.verified === true || entry?.verified === "true" || profile._json?.email_verified === true
                    if (!email || !verified) return done(null, false)

                    let user = await userModel.findOne({ googleId: profile.id })

                    if (!user) {
                        // same email already registered with a password -> link the Google account to it
                        user = await userModel.findOne({ email })
                        if (user) {
                            if (user.role === ROLES.SUPERADMIN) return done(null, false)
                            user.googleId = profile.id
                            if (!user.avatar) user.avatar = profile.photos?.[0]?.value || ""
                            await user.save()
                        } else {
                            // first time: create a customer account
                            user = await userModel.create({
                                username: await uniqueUsername(email, profile.displayName),
                                email,
                                googleId: profile.id,
                                avatar: profile.photos?.[0]?.value || "",
                                role: ROLES.USER,
                            })
                            announceAccountCreated()
                        }
                    }

                    // the super admin signs in with email + password only
                    if (user.role === ROLES.SUPERADMIN) return done(null, false)
                    return done(null, user)
                } catch (err) {
                    return done(err)
                }
            }
        )
    )
}
