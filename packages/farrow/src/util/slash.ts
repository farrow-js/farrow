export default function slash(path: string) {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);

    if (isExtendedLengthPath) {
        return path;
    }

    return path.replace(/\\/g, '/');
}