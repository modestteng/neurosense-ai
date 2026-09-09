import type { Knowledge } from '@/lib/neuro';
export async function readKnowledge(file:File):Promise<Knowledge>{
  if(file.size>10*1024*1024)throw new Error('单个文件请小于 10 MB。');
  let text='',pages:number|undefined;
  if(/\.pdf$/i.test(file.name)){
    const pdfjs=await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
    const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
    const doc=await task.promise;
    try{
      pages=doc.numPages;if(pages>80)throw new Error('请使用 80 页以内的 PDF。');
      for(let page=1;page<=pages;page++){const content=await(await doc.getPage(page)).getTextContent();text+=`\n第 ${page} 页\n`+content.items.map(item=>'str'in item?item.str:'').join(' ');if(text.length>150000)break;}
    }finally{await task.destroy()}
    if(text.replace(/第 \d+ 页/g,'').trim().length<20)throw new Error('这份 PDF 没有可读取的文字，扫描版需要先做文字识别。');
  }else if(/\.(txt|md)$/i.test(file.name)){text=await file.text();}else throw new Error('当前支持文字型 PDF、TXT、Markdown。PPT 请先导出为 PDF。');
  if(!text.trim())throw new Error('文件内容为空。');
  return {id:crypto.randomUUID(),name:file.name,text:text.slice(0,150000),pages};
}
