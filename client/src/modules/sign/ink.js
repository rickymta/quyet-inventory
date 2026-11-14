/* Tách nền trắng của ảnh scan/ảnh chụp (chép nguyên văn từ cutInk của app gốc 2026111401). */
export function cutInk(sd,sens,on){
  var w=sd.width,h=sd.height,s=sd.data,out=new ImageData(w,h),d=out.data,n=w*h,i,j,L=new Uint8Array(n),hist=new Uint32Array(256),rc=new Uint32Array(h),cc=new Uint32Array(w),A=new Uint8Array(n);
  for(i=0;i<n;i++){j=i*4;var l=s[j+3]<128?255:Math.round(.299*s[j]+.587*s[j+1]+.114*s[j+2]);L[i]=l;hist[l]++;}
  var bg=255;
  if(on){var c=0,t=n*.85;for(i=0;i<256;i++){c+=hist[i];if(c>=t){bg=i;break;}}bg=Math.max(bg,140);}
  var hi=.78+.19*sens/100,lo=.40+.30*sens/100;
  for(i=0;i<n;i++){
    j=i*4;var a;
    if(on){var r=Math.min(1,L[i]/bg);a=(hi-r)/(hi-lo);a=a<0?0:a>1?1:a;if(s[j+3]<128)a=0;
      if(a>0){var f=L[i]>80?80/L[i]:1;d[j]=s[j]*f;d[j+1]=s[j+1]*f;d[j+2]=s[j+2]*f;d[j+3]=Math.round(a*255);}}
    else{d[j]=s[j];d[j+1]=s[j+1];d[j+2]=s[j+2];d[j+3]=s[j+3];a=s[j+3]/255;}
    if(a>.5){A[i]=1;rc[(i/w)|0]++;cc[i%w]++;}
  }
  var x0=0,x1=w-1,y0=0,y1=h-1,k=on?2:0;
  while(x0<w&&cc[x0]<=k)x0++;while(x1>=0&&cc[x1]<=k)x1--;while(y0<h&&rc[y0]<=k)y0++;while(y1>=0&&rc[y1]<=k)y1--;
  if(x0>=x1||y0>=y1)return null;
  return {img:out,box:[x0,y0,x1,y1]};
}
