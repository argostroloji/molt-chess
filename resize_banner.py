from PIL import Image
import sys

def resize_image(input_path, output_path):
    try:
        img = Image.open(input_path)
        print(f"Original size: {img.size}")
        
        # Target 3:1 ratio, e.g., 1500x500
        target_width = 1500
        target_height = 500
        
        # Resize logic: Crop the center to match aspect ratio then resize
        # or just resize if close enough. Let's crop to 3:1 then resize.
        
        current_ratio = img.width / img.height
        target_ratio = target_width / target_height
        
        if current_ratio > target_ratio:
            # Too wide, crop width
            new_width = int(img.height * target_ratio)
            offset = (img.width - new_width) // 2
            img = img.crop((offset, 0, offset + new_width, img.height))
        else:
            # Too tall, crop height
            new_height = int(img.width / target_ratio)
            offset = (img.height - new_height) // 2
            img = img.crop((0, offset, img.width, offset + new_height))
            
        img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        img.save(output_path)
        print(f"Saved to {output_path} with size {img.size}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    resize_image(r"C:\Users\eray\OneDrive\Masaüstü\molt_chess_banner.png", r"C:\Users\eray\OneDrive\Masaüstü\molt_chess_banner_fixed.png")
