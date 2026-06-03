import pickle
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import os

syntetic_data = pd.read_csv('./data/synthetic_plant_data.csv')
y=syntetic_data['Relay']
X=syntetic_data.drop(columns=['Relay'])
x_train, x_test, y_train, y_test = train_test_split(X, y, test_size = 0.2, random_state=0)
rf = RandomForestClassifier(n_estimators=100, random_state=0, class_weight='balanced')
rf.fit(x_train, y_train)
acc = rf.score(x_test,y_test)*100

print("Random Forest Algorithm Accuracy Score : {:.2f}%".format(acc))
print("Classification Report:")
print(classification_report(y_test, rf.predict(x_test)))
print("Confusion Matrix:")
print(confusion_matrix(y_test, rf.predict(x_test)))
os.makedirs('./model', exist_ok=True)
with open('./model/potty_model.pkl', 'wb') as f:
    pickle.dump(rf, f)
    print("Model trained and saved to 'potty_model.pkl'.")