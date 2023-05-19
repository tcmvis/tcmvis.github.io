close all;
projData = readtable('newdata.csv');
Tab = projData(1:48,3:6);
M = table2array(Tab);
M_symp = M(:,1:2); 
M_sqww = M(:,3:4);

% normalize data
figure;
subplot(1,2,1), scatter(M_symp(:,1),M_symp(:,2));
subplot(1,2,2), scatter(M_sqww(:,1),M_sqww(:,2));

symp_bbox = points2bbox(M_symp);
sqww_bbox = points2bbox(M_sqww);

%normalize to [-0.5,0.5]
M_symp(:,1) = (M_symp(:,1) - symp_bbox(1)) ./ symp_bbox(3) - 0.5;
M_symp(:,2) = (M_symp(:,2) - symp_bbox(2)) ./ symp_bbox(4) - 0.5;

M_sqww(:,1) = (M_sqww(:,1) - sqww_bbox(1)) ./ sqww_bbox(3) - 0.5;
M_sqww(:,2) = (M_sqww(:,2) - sqww_bbox(2)) ./ sqww_bbox(4) - 0.5;
figure;
subplot(1,2,1), scatter(M_symp(:,1),M_symp(:,2));
subplot(1,2,2), scatter(M_sqww(:,1),M_sqww(:,2));

% find the optimal rotation angle
min_total_dist = inf;
best_theta = 0;
M_sympT = M_symp';
M_sympRotT = M_sympT;
M_sqwwT = M_sqww';
step = pi/180.0;
for theta = 0:step:pi
    rot = [cos(theta), -sin(theta);
        sin(theta), cos(theta)];
    total_dist = 0;
    for i = 1:length(M_symp)
        M_sympRotT(:,i) = rot * M_sympT(:,i);
    end
    M_sympRot = M_sympRotT';
    symp_bboxRot = points2bbox(M_sympRot);
    
    M_sympRot(:,1) = (M_sympRot(:,1) - symp_bboxRot(1)) ./ symp_bboxRot(3) - 0.5;
    M_sympRot(:,2) = (M_sympRot(:,2) - symp_bboxRot(2)) ./ symp_bboxRot(4) - 0.5;
    diff = M_sympRot - M_sqww;
    total_dist= sum(vecnorm(diff'));
    if( min_total_dist > total_dist)
     min_total_dist = total_dist;
     best_theta = theta;
    end
    
end

figure;
subplot(1,2,1), scatter(M_sympRot(:,1),M_sympRot(:,2));
subplot(1,2,2), scatter(M_sqww(:,1),M_sqww(:,2));
Mout = [M_sympRot, M_sqww];
dlmwrite('rotData.csv', Mout);

function bbox = points2bbox(roi)
% This is a function that takes in an roi (a set of four points) and
% outpouts a bbox (which is in for form of x,y,w,h, where x and y
% correspond to the lower left of the coordinates for the points. 

% Getting x and y data
x = roi(:,1);
y = roi(:,2);

% Getting width and height
width = max(x) - min(x);
height = max(y) - min(y);

% Constructing bbox
bbox = [min(x) min(y) width height]
end