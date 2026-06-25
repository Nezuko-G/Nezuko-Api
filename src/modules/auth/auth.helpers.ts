export function cleanUser(user: any) {
    if (!user) return null;
    const obj = { ...user };
    delete obj.passwordHash;
    delete obj.isActive;
    return obj;
}
