#!/usr/bin/env python3
import os
import re
import json
import shutil
import subprocess

SRC_ROOT = '/Users/sreeragchandran/Desktop/Sreerag Website /Works/Works'
TARGET_IMAGE_ROOT = '/Users/sreeragchandran/Desktop/Sreerag Website /Website sreerag/public/images/works'
OUTPUT_TS_PATH = '/Users/sreeragchandran/Desktop/Sreerag Website /Website sreerag/src/data/portfolioData.ts'

ORDERED_PROJECT_FOLDERS = [
    'DB11 Campaign _Aston Martin ',
    'WCEMS_NCEMA',
    'A2RL ACTIVATION _Yas Mall',
    'ABU DHABI AI SUMMIT_TII',
    'ACTIVE & EARN_Yourfitness. Coach',
    'AI71 LAUNCH_ATRC',
    'ANNUAL GATHERING_RTA Dubai',
    'BEING HUMAN_Personal exhibition',
    'EFIICA AWARDS_Abu Dhabi Islamic Bank',
    'EXHIBITIN STANDS_Various Projects',
    'GENERATION READINESS_ NCEMA',
    'NATIONAL DAY EVENT_Abu Dhabi National Bank',
    'PHOTO CAMPAIGN_Yourfitness.coach',
    'SEF_Sheraa',
    'SIP FRESH FEEL ALIVE_Amazon float',
]

COPYRIGHT_MAP = {
    'DB11 Campaign _Aston Martin ': 'Creative work shown here was produced during my time with Tashgeel Media and Advertising WLL. All project ownership and image copyrights remain with the company.',
    'WCEMS_NCEMA': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'A2RL ACTIVATION _Yas Mall': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'ABU DHABI AI SUMMIT_TII': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'ACTIVE & EARN_Yourfitness. Coach': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'AI71 LAUNCH_ATRC': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'ANNUAL GATHERING_RTA Dubai': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'BEING HUMAN_Personal exhibition': 'Copyright reserved to Sreerag Chandran.',
    'EFIICA AWARDS_Abu Dhabi Islamic Bank': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'EXHIBITIN STANDS_Various Projects': 'Creative work shown here was produced during my time with Tashgeel Media and Advertising WLL. All project ownership and image copyrights remain with the company.',
    'GENERATION READINESS_ NCEMA': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'NATIONAL DAY EVENT_Abu Dhabi National Bank': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'PHOTO CAMPAIGN_Yourfitness.coach': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'SEF_Sheraa': 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.',
    'SIP FRESH FEEL ALIVE_Amazon float': 'Creative work shown here was produced during my time with Tashgeel Media and Advertising WLL. All project ownership and image copyrights remain with the company.',
}

DEFAULT_COPYRIGHT = 'Creative work shown here was produced during my time with Option1 Event Services LLC. All project ownership and image copyrights remain with the company.'

SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}

def natural_keys(text):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', text)]

def slugify(text):
    clean = re.sub(r'[^a-zA-Z0-9]+', '-', text.strip().lower()).strip('-')
    return clean

def get_dimensions(filepath):
    try:
        out = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', filepath], stderr=subprocess.DEVNULL).decode('utf-8')
        w = int(re.search(r'pixelWidth: (\d+)', out).group(1))
        h = int(re.search(r'pixelHeight: (\d+)', out).group(1))
        return w, h
    except Exception as e:
        return 0, 0

def optimize_image(src_path, dest_path, max_dim=2000, quality=85):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    shutil.copy2(src_path, dest_path)
    
    w, h = get_dimensions(dest_path)
    if w == 0 or h == 0:
        return 0, 0, 0, 'landscape'
    
    current_max = max(w, h)
    if current_max > max_dim:
        subprocess.run(['sips', '--resampleHeightWidthMax', str(max_dim), dest_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    ext = os.path.splitext(dest_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        subprocess.run(['sips', '-s', 'formatOptions', str(quality), dest_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    final_w, final_h = get_dimensions(dest_path)
    ar = round(final_w / final_h, 3) if final_h > 0 else 1.0
    if ar > 1.15:
        orientation = 'landscape'
    elif ar < 0.85:
        orientation = 'portrait'
    else:
        orientation = 'square'
        
    return final_w, final_h, ar, orientation

def main():
    print("=== Starting Works Asset Sync & Data Generation ===")
    os.makedirs(TARGET_IMAGE_ROOT, exist_ok=True)
    
    all_disk_folders = [
        f for f in os.listdir(SRC_ROOT)
        if os.path.isdir(os.path.join(SRC_ROOT, f)) and not f.startswith('.')
    ]
    
    folders_to_process = list(ORDERED_PROJECT_FOLDERS)
    for f in sorted(all_disk_folders):
        if f not in folders_to_process:
            folders_to_process.append(f)
            
    projects_data = []
    
    for order_idx, folder_name in enumerate(folders_to_process, start=1):
        folder_path = os.path.join(SRC_ROOT, folder_name)
        if not os.path.exists(folder_path):
            print(f"WARNING: Folder does not exist: {folder_path}")
            continue
            
        parts = folder_name.split('_', 1)
        title = parts[0].strip()
        subtitle = parts[1].strip() if len(parts) > 1 else ''
        
        slug = slugify(folder_name)
        dest_folder = os.path.join(TARGET_IMAGE_ROOT, slug)
        
        files = [
            f for f in os.listdir(folder_path)
            if not f.startswith('.') and os.path.splitext(f)[1].lower() in SUPPORTED_EXTENSIONS
        ]
        
        thumbnail_files = [f for f in files if os.path.splitext(f)[0].lower() == 'thumbnail']
        non_thumbnail_files = [f for f in files if os.path.splitext(f)[0].lower() != 'thumbnail']
        non_thumbnail_files.sort(key=natural_keys)
        
        if thumbnail_files:
            thumb_filename = thumbnail_files[0]
            thumb_src_path = os.path.join(folder_path, thumb_filename)
            thumb_dest_path = os.path.join(dest_folder, 'Thumbnail.jpg')
            tw, th, tar, torient = optimize_image(thumb_src_path, thumb_dest_path, max_dim=1600, quality=85)
            thumbnail_url = f"/images/works/{slug}/Thumbnail.jpg"
        else:
            print(f"Thumbnail missing for [{title}]")
            if non_thumbnail_files:
                fallback_file = non_thumbnail_files[0]
                thumb_src_path = os.path.join(folder_path, fallback_file)
                thumb_dest_path = os.path.join(dest_folder, 'Thumbnail.jpg')
                tw, th, tar, torient = optimize_image(thumb_src_path, thumb_dest_path, max_dim=1600, quality=85)
                thumbnail_url = f"/images/works/{slug}/Thumbnail.jpg"
            else:
                thumbnail_url = ""
                
        gallery_images = []
        for img_idx, img_file in enumerate(non_thumbnail_files, start=1):
            img_src_path = os.path.join(folder_path, img_file)
            img_dest_name = f"{img_idx:02d}.jpg"
            img_dest_path = os.path.join(dest_folder, img_dest_name)
            
            gw, gh, gar, gorient = optimize_image(img_src_path, img_dest_path, max_dim=2000, quality=85)
            img_url = f"/images/works/{slug}/{img_dest_name}"
            
            gallery_images.append({
                'id': f"{slug}-{img_idx:02d}",
                'src': img_url,
                'filename': img_file,
                'width': gw,
                'height': gh,
                'aspectRatio': gar,
                'orientation': gorient
            })
            
        copyright_text = COPYRIGHT_MAP.get(folder_name, DEFAULT_COPYRIGHT)
        
        project_entry = {
            'id': slug,
            'slug': slug,
            'folderName': folder_name,
            'title': title,
            'subtitle': subtitle,
            'thumbnail': thumbnail_url,
            'galleryImages': gallery_images,
            'copyright': copyright_text,
            'order': order_idx,
        }
        projects_data.append(project_entry)
        print(f"[{order_idx:02d}] {title} ({subtitle}) -> {len(gallery_images)} gallery images")
        
    ts_content = f"""// Sreerag Chandran Unified Portfolio Projects Data
// Auto-generated from source folder: /Users/sreeragchandran/Desktop/Sreerag Website /Works/Works

export interface ProjectImageItem {{
  id: string;
  src: string;
  filename: string;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}}

export interface UnifiedPortfolioProject {{
  id: string;
  slug: string;
  folderName: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  galleryImages: ProjectImageItem[];
  copyright: string;
  order: number;
}}

export const PORTFOLIO_PROJECTS: UnifiedPortfolioProject[] = {json.dumps(projects_data, indent=2)};

export const getProjectBySlug = (slug: string): UnifiedPortfolioProject | undefined => {{
  return PORTFOLIO_PROJECTS.find((p) => p.slug === slug || p.id === slug);
}};
"""
    with open(OUTPUT_TS_PATH, 'w') as f:
        f.write(ts_content)
        
    print(f"\nSUCCESS: Generated {len(projects_data)} projects in {OUTPUT_TS_PATH}")

if __name__ == '__main__':
    main()
