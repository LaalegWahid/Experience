import gathraLogo from "@/public/gathra_logo_4.png";
import gathraLogoLight from "@/public/gathra_white.png";
import gathraLogoDark from "@/public/gathra_black.png";

// Importing the file (instead of a plain "/gathra_logo_4.png" string) makes
// the bundler content-hash the output filename, so replacing the source
// image invalidates old browser/CDN caches automatically instead of
// requiring a hard refresh.
export { gathraLogo, gathraLogoLight, gathraLogoDark };
