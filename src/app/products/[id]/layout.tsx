import { Metadata, ResolvingMetadata } from 'next';
import { Product } from '@/store/useProductStore';

type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  
  // Fetch data
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  let product: Product | null = null;
  
  try {
    const res = await fetch(`${apiUrl}/products/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      product = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch product for metadata:', error);
  }

  if (!product) {
    return {
      title: "Product Not Found | You're Wearing Legacy",
      description: "The requested product could not be found.",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];
  
  // Try to use absolute URL for image
  const apiBase = apiUrl.replace('/api', '');
  const imageUrl = product.image_url 
    ? (product.image_url.startsWith('http') ? product.image_url : `${apiBase}${product.image_url}`)
    : undefined;

  return {
    title: `${product.name} | You're Wearing Legacy`,
    description: product.description 
      ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 160) // strip HTML and truncate
      : `Shop ${product.name} at You're Wearing Legacy. Discover premium online clothing and modern fashion.`,
    openGraph: {
      title: `${product.name} | You're Wearing Legacy`,
      description: product.description 
        ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 160) 
        : `Shop ${product.name} at You're Wearing Legacy.`,
      images: imageUrl ? [imageUrl, ...previousImages] : previousImages,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | You're Wearing Legacy`,
      description: product.description 
        ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 160) 
        : `Shop ${product.name} at You're Wearing Legacy.`,
      images: imageUrl ? [imageUrl] : [],
    }
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
