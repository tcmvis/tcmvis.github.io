library(Rtsne)

df <- UMLSld_Med_04_18

View(df)

tsne_out <- Rtsne(
  df,
  dims = 2,
  pca = TRUE,
  perplexity = 10,
  theta = 0.0,
  max_iter = 1000
)
str(tsne_out)
dim(tsne_out)
View(tsne_out)

plot(tsne_out$Y)
summary(df)

imPrComp = prcomp(df[,c(2:47)], center = TRUE,scale. = TRUE)

summary(imPrComp)


library(devtools)
remotes::install_github('vqv/ggbiplot')

library(ggbiplot)

ggbiplot(imPrComp)
