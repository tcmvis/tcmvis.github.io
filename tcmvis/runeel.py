import eel
import numpy as np
from ciecam02 import rgb2jch, jch2rgb
import colour 
from scipy.interpolate import Rbf
# from scipy.interpolate import RBFInterpolator
import matplotlib.pyplot as plt

# Set web files folder and optionally specify which file types to check for eel.expose()
#   *Default allowed_extensions are: ['.js', '.html', '.txt', '.htm', '.xhtml']
eel.init('web', allowed_extensions=['.js', '.html'])


@eel.expose 
def rgb2rgbbyj(x,y,xi,yi,wuindex,ori):
    # ori=[3, 2, 1, 0, 4]
    # rgb = np.array([[81, 118, 147],
    #             [143, 75, 40],
    #             [128, 0, 32],
    #             [0, 140, 149],
    #             [0, 49, 83]
    #             ])
    rgb = np.array([[0, 124, 128],
                    [232, 78, 60],
                    [174, 121, 50],
                    [160, 160, 160],
                    [0, 49, 75]
                # [100, 100, 128]
                    ])
    #jch=rgb2jch(rgb)
    xyz = colour.sRGB_to_XYZ(rgb/255)
    jch = colour.XYZ_to_UCS(xyz)
    jjj=jch[:,0]
    ccc=jch[:,1]
    hhh=jch[:,2]
    op='linear'
    op2= 'linear'
    rbfj = Rbf(x, y, jjj, function=op)
    rbfc = Rbf(x, y, ccc, function=op)
    rbfh = Rbf(x, y, hhh, function=op2)
    jjji = rbfj(xi, yi)  
    ccci = rbfc(xi, yi)
    hhhi = rbfh(xi, yi)
    # for i in range(len(jjji)):
    #     if jjji[i]<=0:
    #         jjji[i]=0.01
    #     elif jjji[i]>=100:
    #         jjji[i]=99.99
    # for i in range(len(hhhi)):
    #     if hhhi[i]<=0:
    #         hhhi[i]=0.01
    #     elif hhhi[i]>=360:
    #         hhhi[i]=359.99
    # for i in range(len(ccci)):
    #     if ccci[i]<=0:
    #         ccci[i]=0.01
    bac1=np.array([jjji,ccci,hhhi])


    # print(bac1)
    newjch=bac1.transpose()
    newjch=newjch.astype(np.float32)


    newrgb = colour.XYZ_to_sRGB(colour.UCS_to_XYZ(newjch))
    # np.savetxt('C:/Users/wuzhi/Desktop/LearningProjects0427/LearningProjects/0430-eel/web/rgb0430.csv', newrgb, delimiter = ',')

    newrgb=newrgb.tolist()
    for i in range(53):
        for j in range(3):
            newrgb[i][j]=str(newrgb[i][j]*255)
    # print(newrgb)
    all0 = [[0 for j in range(3)] for i in range(58)]
    # wuindex=[0, 7, 11, 18, 40]
    wuxing=[['0', '124', '128'],
            ['232', '78', '60'],
            ['174', '121', '50'],
            ['160', '160', '160'],
            ['0', '49', '75']
    ]
    if wuindex[0]==0:
        all0[0]=wuxing[ori[0]]
        all0[wuindex[1]]=wuxing[ori[1]]
        all0[wuindex[2]]=wuxing[ori[2]]
        all0[wuindex[3]]=wuxing[ori[3]]
        all0[wuindex[4]]=wuxing[ori[4]]
        all0[1:(wuindex[1])]=newrgb[0:(wuindex[1]-1)]
        all0[(wuindex[1]+1):(wuindex[2])]=newrgb[(wuindex[1]-1):(wuindex[2]-2)]
        all0[(wuindex[2]+1):(wuindex[3])]=newrgb[(wuindex[2]-2):(wuindex[3]-3)]
        all0[(wuindex[3]+1):(wuindex[4])]=newrgb[(wuindex[3]-3):(wuindex[4]-4)]
        all0[(wuindex[4]+1):]=newrgb[(wuindex[4]-4):]
        # print(all0)

    if wuindex[0]!=0:
        all0[wuindex[0]]=wuxing[ori[0]]
        all0[wuindex[1]]=wuxing[ori[1]]
        all0[wuindex[2]]=wuxing[ori[2]]
        all0[wuindex[3]]=wuxing[ori[3]]
        all0[wuindex[4]]=wuxing[ori[4]]
        all0[0:(wuindex[0])]=newrgb[0:(wuindex[0])]
        all0[(wuindex[0]+1):(wuindex[1])] = newrgb[(wuindex[0]):(wuindex[1]-1)]
        all0[(wuindex[1] + 1):(wuindex[2])] = newrgb[(wuindex[1]-1):(wuindex[2] - 2)]
        all0[(wuindex[2] + 1):(wuindex[3])] = newrgb[(wuindex[2]-2):(wuindex[3] - 3)]
        all0[(wuindex[3] + 1):(wuindex[4])] = newrgb[(wuindex[3]-3):(wuindex[4] - 4)]
        all0[(wuindex[4] + 1):] = newrgb[(wuindex[4] - 4):]
        # print(all0)


    allrgb0=[]
    for i in range(58):
        allrgb0.append(0)
    # print(allrgb0)

    for k in range(58):
        allrgb0[k]="rgb("+all0[k][0]+","+all0[k][1]+","+all0[k][2]+")"
    # allrgb0[:,0]=all0[:,0]+all0[:,1]+all0[:,2]
    # print(allrgb0)

    import pandas as pd

    data = pd.read_csv(r"web/fangjidata0425.csv",encoding='utf-8')
    # print(data.columns)  # 获取列索引值
    data1=allrgb0 # 将新列的名字设置为cha
    data['rgb']=data1
    data.to_csv(r"web/fangjidata0504.csv", index=False,encoding='utf-8')
    # mode=a，以追加模式写入,header表示列名，默认为true,index表示行名，默认为true，再次写入不需要行名
    #print(data)

    dimx = 128
    dimy = 128
    # xmin = -4.655617714
    # xmax = -1.373338819
    # ymin = -4.429816246
    # ymax = 1.586563945
    xmin = -4.8
    xmax = -1.1
    ymin = -5
    ymax = 2
    x_new = np.linspace(xmin, xmax, dimx)
    y_new= np.linspace(ymin, ymax, dimy)
    x_grid, y_grid = np.meshgrid(x_new, y_new)
    mapxi=x_grid.ravel()
    mapyi=y_grid.ravel()
    # print(mapxi)
    # rbfj = rbfj.reshape(xi, yi)
    # rbfc = rbfc.reshape(xi, yi)
    # rbfh = rbfh.reshape(xi, yi)
    # xi=[-3.140700817,-4.655617714,-4.523247719,-4.429934025,-1.504244208,-3.824779987,-3.906730175,-3.413937092,-4.269578934,-1.886649609,-3.309570789,-1.373338819,-2.883019924,-2.77603507,-2.738422632,-2.987339973,-2.257733583,-2.261112452,-2.423458576,-3.002579689,-3.841306448,-4.049615383,-2.297468424,-1.513089895,-3.865788221,-4.109154224,-2.597402573,-3.590692997,-2.100105047,-2.701319695,-2.664515972,-1.91862309,-1.977849483,-3.960914612,-3.765055656,-2.559403658,-2.083695889,-2.545398951,-1.41849494,-4.61407423,-2.168384314,-1.60704124,-2.97184515,-3.198005676,-3.057582855,-2.354230642,-2.4959867,-2.003940582,-3.425074339,-3.735731125,-2.563746929,-2.309523344,-1.73198545]
    # yi=[0.942083657,-1.043939829,-0.609639764,-0.079158716,-0.00548108,0.357004225,-0.022498643,0.252200156,-0.515816808,0.680230796,-1.132460117,-1.060228109,-0.620351553,-1.917709827,-0.071033478,-3.009689093,1.252760172,-3.802080393,1.586563945,-0.276521504,-3.153040886,-0.543394983,-3.011219263,-2.76542902,-3.743286133,-2.61918664,-4.429816246,-3.355566978,-2.541544199,-2.368893623,-1.804931641,-2.582026482,-4.042625904,-1.899103045,-2.320254803,-3.592699766,-3.465502024,-2.752537489,-0.615175426,-1.565720201,1.319137931,-0.711083055,-3.365247965,-4.076366901,-3.728332996,0.802957475,-3.973608017,0.899944186,-0.160854667,-3.632935047,1.226793647,0.324441075,-1.045446277]
    mapjjji = rbfj(mapxi, mapyi)
    mapccci = rbfc(mapxi, mapyi)
    maphhhi = rbfh(mapxi, mapyi)
    # for i in range(len(mapjjji)):
    #     if mapjjji[i]<=0:
    #         mapjjji[i]=0.01
    #     elif mapjjji[i]>=100:
    #         mapjjji[i]=99.99
    # for i in range(len(maphhhi)):
    #     if maphhhi[i]<=0:
    #         maphhhi[i]=0.01
    #     elif maphhhi[i]>=360:
    #         maphhhi[i]=359.99
    # for i in range(len(mapccci)):
    #     if mapccci[i]<=0:
    #         mapccci[i]=0.01
    bac1=np.array([mapjjji,mapccci,maphhhi])


    # print(bac1)
    mapnewjch=bac1.transpose()
    mapnewjch=mapnewjch.astype(np.float32)


    # print(newjch)
    mapnewrgb=colour.XYZ_to_sRGB(colour.UCS_to_XYZ(mapnewjch))



    # print(mapnewrgb.shape)
    newrgb2d = np.reshape(mapnewrgb,(dimx,dimy,3))
    # print(newrgb2d)
    # print(newrgb2d.shape)

    plt.axis('off')
    plt.imshow(newrgb2d)
    plt.savefig("web/rbftest2.png", bbox_inches='tight', pad_inches=0.00)
    xnp = np.array(x)
    ynp = np.array(y)
    # print(xnp,ynp)
    # plt.plot((xnp - xmin)/(xmax-xmin)*(dimx-1), (ynp - ymin)/(ymax-ymin)*(dimy-1), 'o');
    plt.plot(((xnp - xmin)/(xmax-xmin)*(dimx-1)), ((ynp - ymin)/(ymax-ymin)*(dimy-1)));
@eel.expose 
def rgb2rgbqrj(x,y,xi,yi,wuindex,ori):
    # ori=[3, 2, 1, 0, 4]
    # rgb = np.array([[81, 118, 147],
    #             [143, 75, 40],
    #             [128, 0, 32],
    #             [0, 140, 149],
    #             [0, 49, 83]
    #             ])
    rgb = np.array([[0, 124, 128], #青
                    [232, 78, 60], #赤
                    [174, 121, 50], #黄
                    [160, 160, 160], #灰（白）
                    [0, 49, 75] #深蓝（黑）
                # [100, 100, 128]
                    ])
    xyz = colour.sRGB_to_XYZ(rgb/255)
    jch = colour.XYZ_to_UCS(xyz)
    jjj=jch[:,0]
    ccc=jch[:,1]
    hhh=jch[:,2]
    op='linear'
    op2= 'linear'
    rbfj = Rbf(x, y, jjj, function=op)
    rbfc = Rbf(x, y, ccc, function=op)
    rbfh = Rbf(x, y, hhh, function=op2)
    jjji = rbfj(xi, yi)  
    ccci = rbfc(xi, yi)
    hhhi = rbfh(xi, yi)
    # for i in range(len(jjji)):
    #     if jjji[i]<=0:
    #         jjji[i]=0.01
    #     elif jjji[i]>=100:
    #         jjji[i]=99.99
    # for i in range(len(hhhi)):
    #     if hhhi[i]<=0:
    #         hhhi[i]=0.01
    #     elif hhhi[i]>=360:
    #         hhhi[i]=359.99
    # for i in range(len(ccci)):
    #     if ccci[i]<=0:
    #         ccci[i]=0.01
    bac1=np.array([jjji,ccci,hhhi])
    # print(bac1)
    newjch=bac1.transpose()
    newjch=newjch.astype(np.float32)
    newrgb = colour.XYZ_to_sRGB(colour.UCS_to_XYZ(newjch))
    newrgb=newrgb.tolist()
    for i in range(68):
        for j in range(3):
            newrgb[i][j]=str(newrgb[i][j]*255)
    print(newrgb)
    all0 = [[0 for j in range(3)] for i in range(73)]
    # wuindex=[0, 7, 11, 18, 40]
    wuxing=[['0', '124', '128'],
            ['232', '78', '60'],
            ['174', '121', '50'],
            ['160', '160', '160'],
            ['0', '49', '75']
    ]
    if wuindex[0]==0:
        all0[0]=wuxing[ori[0]]
        all0[wuindex[1]]=wuxing[ori[1]]
        all0[wuindex[2]]=wuxing[ori[2]]
        all0[wuindex[3]]=wuxing[ori[3]]
        all0[wuindex[4]]=wuxing[ori[4]]
        all0[1:(wuindex[1])]=newrgb[0:(wuindex[1]-1)]
        all0[(wuindex[1]+1):(wuindex[2])]=newrgb[(wuindex[1]-1):(wuindex[2]-2)]
        all0[(wuindex[2]+1):(wuindex[3])]=newrgb[(wuindex[2]-2):(wuindex[3]-3)]
        all0[(wuindex[3]+1):(wuindex[4])]=newrgb[(wuindex[3]-3):(wuindex[4]-4)]
        all0[(wuindex[4]+1):]=newrgb[(wuindex[4]-4):]
        print(all0)

    if wuindex[0]!=0:
        all0[wuindex[0]]=wuxing[ori[0]]
        all0[wuindex[1]]=wuxing[ori[1]]
        all0[wuindex[2]]=wuxing[ori[2]]
        all0[wuindex[3]]=wuxing[ori[3]]
        all0[wuindex[4]]=wuxing[ori[4]]
        all0[0:(wuindex[0])]=newrgb[0:(wuindex[0])]
        all0[(wuindex[0]+1):(wuindex[1])] = newrgb[(wuindex[0]):(wuindex[1]-1)]
        all0[(wuindex[1] + 1):(wuindex[2])] = newrgb[(wuindex[1]-1):(wuindex[2] - 2)]
        all0[(wuindex[2] + 1):(wuindex[3])] = newrgb[(wuindex[2]-2):(wuindex[3] - 3)]
        all0[(wuindex[3] + 1):(wuindex[4])] = newrgb[(wuindex[3]-3):(wuindex[4] - 4)]
        all0[(wuindex[4] + 1):] = newrgb[(wuindex[4] - 4):]
        print(all0)


    allrgb0=[]
    for i in range(73):
        allrgb0.append(0)
    print(allrgb0)

    for k in range(73):
        allrgb0[k]="rgb("+all0[k][0]+","+all0[k][1]+","+all0[k][2]+")"
    # allrgb0[:,0]=all0[:,0]+all0[:,1]+all0[:,2]
    print(allrgb0)

    import pandas as pd

    data = pd.read_csv(r"web/qrfangjidata0425.csv",encoding='utf-8')
    print(data.columns)  # 获取列索引值
    data1=allrgb0 # 将新列的名字设置为cha
    data['rgb']=data1
    data.to_csv(r"web/qrfangjidata0504.csv", index=False,encoding='utf-8')
    # mode=a，以追加模式写入,header表示列名，默认为true,index表示行名，默认为true，再次写入不需要行名
    print(data)

    dimx = 128
    dimy = 128
    xmin = 11.5
    xmax = 16
    ymin = 8
    ymax = 13.5
    x_new = np.linspace(xmin, xmax, dimx)
    y_new= np.linspace(ymin, ymax, dimy)
    x_grid, y_grid = np.meshgrid(x_new, y_new)
    mapxi=x_grid.ravel()
    mapyi=y_grid.ravel()
    # rbfj = rbfj.reshape(xi, yi)
    # rbfc = rbfc.reshape(xi, yi)
    # rbfh = rbfh.reshape(xi, yi)
    # xi=[-3.140700817,-4.655617714,-4.523247719,-4.429934025,-1.504244208,-3.824779987,-3.906730175,-3.413937092,-4.269578934,-1.886649609,-3.309570789,-1.373338819,-2.883019924,-2.77603507,-2.738422632,-2.987339973,-2.257733583,-2.261112452,-2.423458576,-3.002579689,-3.841306448,-4.049615383,-2.297468424,-1.513089895,-3.865788221,-4.109154224,-2.597402573,-3.590692997,-2.100105047,-2.701319695,-2.664515972,-1.91862309,-1.977849483,-3.960914612,-3.765055656,-2.559403658,-2.083695889,-2.545398951,-1.41849494,-4.61407423,-2.168384314,-1.60704124,-2.97184515,-3.198005676,-3.057582855,-2.354230642,-2.4959867,-2.003940582,-3.425074339,-3.735731125,-2.563746929,-2.309523344,-1.73198545]
    # yi=[0.942083657,-1.043939829,-0.609639764,-0.079158716,-0.00548108,0.357004225,-0.022498643,0.252200156,-0.515816808,0.680230796,-1.132460117,-1.060228109,-0.620351553,-1.917709827,-0.071033478,-3.009689093,1.252760172,-3.802080393,1.586563945,-0.276521504,-3.153040886,-0.543394983,-3.011219263,-2.76542902,-3.743286133,-2.61918664,-4.429816246,-3.355566978,-2.541544199,-2.368893623,-1.804931641,-2.582026482,-4.042625904,-1.899103045,-2.320254803,-3.592699766,-3.465502024,-2.752537489,-0.615175426,-1.565720201,1.319137931,-0.711083055,-3.365247965,-4.076366901,-3.728332996,0.802957475,-3.973608017,0.899944186,-0.160854667,-3.632935047,1.226793647,0.324441075,-1.045446277]
    mapjjji = rbfj(mapxi, mapyi)
    mapccci = rbfc(mapxi, mapyi)
    maphhhi = rbfh(mapxi, mapyi)
    # for i in range(len(mapjjji)):
    #     if mapjjji[i]<=0:
    #         mapjjji[i]=0.01
    #     elif mapjjji[i]>=100:
    #         mapjjji[i]=99.99
    # for i in range(len(maphhhi)):
    #     if maphhhi[i]<=0:
    #         maphhhi[i]=0.01
    #     elif maphhhi[i]>=360:
    #         maphhhi[i]=359.99
    # for i in range(len(mapccci)):
    #     if mapccci[i]<=0:
    #         mapccci[i]=0.01
    bac1=np.array([mapjjji,mapccci,maphhhi])
    bac2=np.array([mapjjji,mapjjji,mapjjji])

    # print(bac1)
    mapnewjch=bac1.transpose()
    mapnewjch=mapnewjch.astype(np.float32)

    mapnewhhh = bac2.transpose()
    mapnewhhh = mapnewhhh.astype(np.float32)
    # print(newjch)
    mapnewrgb=colour.XYZ_to_sRGB(colour.UCS_to_XYZ(mapnewjch))
    mapnewrgbx = mapnewhhh/100
    # newrgb = newrgbx
    # print(newrgb)

    print(mapnewrgb.shape)
    newrgb2d = np.reshape(mapnewrgb,(dimx,dimy,3))
    print(newrgb2d.shape)
    plt.axis('off')
    plt.imshow(newrgb2d)
    plt.savefig("web/rbftest3.png", bbox_inches='tight', pad_inches=0.00)
    xnp = np.array(x)
    ynp = np.array(y)
    print(xnp,ynp)
    plt.plot((xnp - xmin)/(xmax-xmin)*(dimx-1), (ynp - ymin)/(ymax-ymin)*(dimy-1));

@eel.expose 
def bargb2rgb(x,y,xi,yi,wuindex,ori):
    # ori=[3, 2, 1, 0, 4]
    # rgb = np.array([[81, 118, 147],
    #             [143, 75, 40],
    #             [128, 0, 32],
    #             [0, 140, 149],
    #             [0, 49, 83]
    #             ])
    rgb = np.array([[0, 124, 128],
                    [232, 78, 60],
                    [174, 121, 50],
                    [160, 160, 160],
                    [0, 49, 75]
                # [100, 100, 128]
                    ])
    #jch=rgb2jch(rgb)
    xyz = colour.sRGB_to_XYZ(rgb/255)
    jch = colour.XYZ_to_UCS(xyz)
    jjj=jch[:,0]
    ccc=jch[:,1]
    hhh=jch[:,2]
    op='linear'
    op2= 'linear'
    rbfj = Rbf(x, y, jjj, function=op)
    rbfc = Rbf(x, y, ccc, function=op)
    rbfh = Rbf(x, y, hhh, function=op2)
    jjji = rbfj(xi, yi)  
    ccci = rbfc(xi, yi)
    hhhi = rbfh(xi, yi)
    # for i in range(len(jjji)):
    #     if jjji[i]<=0:
    #         jjji[i]=0.01
    #     elif jjji[i]>=100:
    #         jjji[i]=99.99
    # for i in range(len(hhhi)):
    #     if hhhi[i]<=0:
    #         hhhi[i]=0.01
    #     elif hhhi[i]>=360:
    #         hhhi[i]=359.99
    # for i in range(len(ccci)):
    #     if ccci[i]<=0:
    #         ccci[i]=0.01
    bac1=np.array([jjji,ccci,hhhi])


    # print(bac1)
    newjch=bac1.transpose()
    newjch=newjch.astype(np.float32)


    newrgb = colour.XYZ_to_sRGB(colour.UCS_to_XYZ(newjch))
    # np.savetxt('C:/Users/wuzhi/Desktop/LearningProjects0427/LearningProjects/0430-eel/web/rgb0430.csv', newrgb, delimiter = ',')

    newrgb=newrgb.tolist()
    for i in range(22):
        for j in range(3):
            newrgb[i][j]=str(newrgb[i][j]*255)
    print(newrgb)
    all0 = [[0 for j in range(3)] for i in range(27)]
    # wuindex=[0, 7, 11, 18, 40]
    wuxing=[['0', '124', '128'],
            ['232', '78', '60'],
            ['174', '121', '50'],
            ['160', '160', '160'],
            ['0', '49', '75']
    ]
    if wuindex[0]==0:
        all0[0]=wuxing[ori[0]]
        all0[wuindex[1]]=wuxing[ori[1]]
        all0[wuindex[2]]=wuxing[ori[2]]
        all0[wuindex[3]]=wuxing[ori[3]]
        all0[wuindex[4]]=wuxing[ori[4]]
        all0[1:(wuindex[1])]=newrgb[0:(wuindex[1]-1)]
        all0[(wuindex[1]+1):(wuindex[2])]=newrgb[(wuindex[1]-1):(wuindex[2]-2)]
        all0[(wuindex[2]+1):(wuindex[3])]=newrgb[(wuindex[2]-2):(wuindex[3]-3)]
        all0[(wuindex[3]+1):(wuindex[4])]=newrgb[(wuindex[3]-3):(wuindex[4]-4)]
        all0[(wuindex[4]+1):]=newrgb[(wuindex[4]-4):]
        print(all0)

    if wuindex[0]!=0:
        all0[wuindex[0]]=wuxing[ori[0]]
        all0[wuindex[1]]=wuxing[ori[1]]
        all0[wuindex[2]]=wuxing[ori[2]]
        all0[wuindex[3]]=wuxing[ori[3]]
        all0[wuindex[4]]=wuxing[ori[4]]
        all0[0:(wuindex[0])]=newrgb[0:(wuindex[0])]
        all0[(wuindex[0]+1):(wuindex[1])] = newrgb[(wuindex[0]):(wuindex[1]-1)]
        all0[(wuindex[1] + 1):(wuindex[2])] = newrgb[(wuindex[1]-1):(wuindex[2] - 2)]
        all0[(wuindex[2] + 1):(wuindex[3])] = newrgb[(wuindex[2]-2):(wuindex[3] - 3)]
        all0[(wuindex[3] + 1):(wuindex[4])] = newrgb[(wuindex[3]-3):(wuindex[4] - 4)]
        all0[(wuindex[4] + 1):] = newrgb[(wuindex[4] - 4):]
        print(all0)


    allrgb0=[]
    for i in range(27):
        allrgb0.append(0)
    print(allrgb0)

    for k in range(27):
        allrgb0[k]="rgb("+all0[k][0]+","+all0[k][1]+","+all0[k][2]+")"
    # allrgb0[:,0]=all0[:,0]+all0[:,1]+all0[:,2]
    print(allrgb0)

    import pandas as pd

    data = pd.read_csv(r"web/bingan1.csv",encoding='utf-8')
    print(data.columns)  # 获取列索引值
    data1=allrgb0 # 将新列的名字设置为cha
    data['rgb']=data1
    data.to_csv(r"web/bingan2.csv", index=False,encoding='utf-8')
    # mode=a，以追加模式写入,header表示列名，默认为true,index表示行名，默认为true，再次写入不需要行名
    #print(data)

    dimx = 128
    dimy = 128
    # xmin = -4.655617714
    # xmax = -1.373338819
    # ymin = -4.429816246
    # ymax = 1.586563945
    xmin = 100
    xmax = 500
    ymin = -1100
    ymax = -500
    x_new = np.linspace(xmin, xmax, dimx)
    y_new= np.linspace(ymin, ymax, dimy)
    x_grid, y_grid = np.meshgrid(x_new, y_new)
    mapxi=x_grid.ravel()
    mapyi=y_grid.ravel()
    print(mapxi)
    # rbfj = rbfj.reshape(xi, yi)
    # rbfc = rbfc.reshape(xi, yi)
    # rbfh = rbfh.reshape(xi, yi)
    # xi=[-3.140700817,-4.655617714,-4.523247719,-4.429934025,-1.504244208,-3.824779987,-3.906730175,-3.413937092,-4.269578934,-1.886649609,-3.309570789,-1.373338819,-2.883019924,-2.77603507,-2.738422632,-2.987339973,-2.257733583,-2.261112452,-2.423458576,-3.002579689,-3.841306448,-4.049615383,-2.297468424,-1.513089895,-3.865788221,-4.109154224,-2.597402573,-3.590692997,-2.100105047,-2.701319695,-2.664515972,-1.91862309,-1.977849483,-3.960914612,-3.765055656,-2.559403658,-2.083695889,-2.545398951,-1.41849494,-4.61407423,-2.168384314,-1.60704124,-2.97184515,-3.198005676,-3.057582855,-2.354230642,-2.4959867,-2.003940582,-3.425074339,-3.735731125,-2.563746929,-2.309523344,-1.73198545]
    # yi=[0.942083657,-1.043939829,-0.609639764,-0.079158716,-0.00548108,0.357004225,-0.022498643,0.252200156,-0.515816808,0.680230796,-1.132460117,-1.060228109,-0.620351553,-1.917709827,-0.071033478,-3.009689093,1.252760172,-3.802080393,1.586563945,-0.276521504,-3.153040886,-0.543394983,-3.011219263,-2.76542902,-3.743286133,-2.61918664,-4.429816246,-3.355566978,-2.541544199,-2.368893623,-1.804931641,-2.582026482,-4.042625904,-1.899103045,-2.320254803,-3.592699766,-3.465502024,-2.752537489,-0.615175426,-1.565720201,1.319137931,-0.711083055,-3.365247965,-4.076366901,-3.728332996,0.802957475,-3.973608017,0.899944186,-0.160854667,-3.632935047,1.226793647,0.324441075,-1.045446277]
    mapjjji = rbfj(mapxi, mapyi)
    mapccci = rbfc(mapxi, mapyi)
    maphhhi = rbfh(mapxi, mapyi)
    # for i in range(len(mapjjji)):
    #     if mapjjji[i]<=0:
    #         mapjjji[i]=0.01
    #     elif mapjjji[i]>=100:
    #         mapjjji[i]=99.99
    # for i in range(len(maphhhi)):
    #     if maphhhi[i]<=0:
    #         maphhhi[i]=0.01
    #     elif maphhhi[i]>=360:
    #         maphhhi[i]=359.99
    # for i in range(len(mapccci)):
    #     if mapccci[i]<=0:
    #         mapccci[i]=0.01
    bac1=np.array([mapjjji,mapccci,maphhhi])
    bac2=np.array([mapjjji,mapjjji,mapjjji])

    # print(bac1)
    mapnewjch=bac1.transpose()
    mapnewjch=mapnewjch.astype(np.float32)

    mapnewhhh = bac2.transpose()
    mapnewhhh = mapnewhhh.astype(np.float32)
    # print(newjch)
    mapnewrgb=colour.XYZ_to_sRGB(colour.UCS_to_XYZ(mapnewjch))
    mapnewrgbx = mapnewhhh/100
    # newrgb = newrgbx
    # print(newrgb)

    print(mapnewrgb.shape)
    newrgb2d = np.reshape(mapnewrgb,(dimx,dimy,3))
    print(newrgb2d)
    print(newrgb2d.shape)
    plt.axis('off')
    plt.imshow(newrgb2d)
    plt.savefig("web/rbftest4.png", bbox_inches='tight', pad_inches=0.00)
    xnp = np.array(x)
    ynp = np.array(y)
    print(xnp,ynp)
    # plt.plot((xnp - xmin)/(xmax-xmin)*(dimx-1), (ynp - ymin)/(ymax-ymin)*(dimy-1), 'o');
    plt.plot(((xnp - xmin)/(xmax-xmin)*(dimx-1)), ((ynp - ymin)/(ymax-ymin)*(dimy-1)));


# eel.start('graphtest_d3v30715.html',mode="edge",port=8081)
eel.start('index.html',mode="edge",port=8080)                  # Start (this blocks and enters loop)