import myw from 'myWorld-client'; //module that allows access to the database, focus the map and set the "Details" tab
import React, { useState, useEffect } from 'react'; //React hooks
import { useLocale } from 'myWorld-client/react'; //Localisation hook
import { DraggableModal, Button } from 'myWorld-client/react'; //Our own react components, using IQGeo layout
import { Avatar, Cascader, List } from 'antd'; //Ant Design components
import greenImg from '../../images/green_circle.png';
import redImg from '../../images/red_circle.png';
import wfm from '../../../../workflow_manager/public/js/base/wfm.js'; //WFM module, used to create the ticket
import {
    buildFeatureList,
    validate,
    createTicketObject,
    buildFields
} from './fieldValidatorFunctions.js';

export const FieldValidatorModal = ({ open }) => {
    const appRef = myw.app; //Application reference
    const db = appRef.database; //Database reference
    const { msg } = useLocale('customRuleModal'); //Localisation hook indicating the localisation group to be used

    const [isOpen, setIsOpen] = useState(open); //Flag indicating if the modal is open

    const [featuresList, setFeaturesList] = useState([]); //List of features for the Cascader
    const [features, setFeatures] = useState(); //List of features from the database for reference
    const [ruleType, setRuleType] = useState(); //Type of rule picked by the user (int, string, bool)
    const [pickedRule, setPickedRule] = useState(''); //Rule picked by the user (<, >, true, false, etc...)
    const [inputtedValue, setInputtedValue] = useState(''); //Value inputted by the user to be compared with the field value
    const [pickedFeatureType, setPickedFeatureType] = useState(''); //Feature type (cable, pole...) picked by the user
    const [pickedField, setPickedField] = useState(''); //Field picked by the user
    const [result, setResult] = useState([]); //Array of validation results

    //Effect that runs after the initial render and queries the database for the list of features.
    //In a nutshell: Queries the database for features and fields and builds the list used by the Cascader
    useEffect(() => {
        const dbFeatures = db.getFeatureTypes();

        //Filtering out some of the features just to have a shorter list of features for the demo
        const filteredFeatures = Object.keys(dbFeatures)
            .filter(
                key =>
                    !/(IN|OUT|processed|comsof|mywwfm|spec|coax|copper|conduit|mywcom|ticket|iqgapp)/.test(
                        key
                    )
            )
            .reduce((obj, key) => {
                obj[key] = dbFeatures[key];
                return obj;
            }, {});

        setFeatures(filteredFeatures);

        let featuresListArray = [];
        featuresListArray = buildFeatureList(filteredFeatures);
        setFeaturesList(featuresListArray);
    }, []);

    //Function that closes the window
    const handleCancel = () => {
        setIsOpen(false);
    };

    //Function called when the user selects a feature and a field from the cascader component
    //It sets the rule type, picked feature and picked field
    //It also resets the picked rule, inputted value and result states
    const onFieldSelected = value => {
        console.log(features[value[0]].fields[value[1]].type);
        const cleanType = features[value[0]].fields[value[1]].type.replace(/\(\d+\)$/, '');
        setRuleType(cleanType);
        setPickedFeatureType(value[0]);
        setPickedField(value[1]);
        setPickedRule('');
        setInputtedValue('');
        setResult([]);
    };

    //Function called when the user types a value in the input field. In case of number fields
    //it validates the input to ensure that it is numbers only or empty before it actually sets
    //the state
    const onValueChange = e => {
        if (ruleType === 'integer' || ruleType === 'double') {
            const regex = /^\d+$/;
            if (regex.test(e.target.value) || e.target.value === '') {
                setInputtedValue(e.target.value);
            }
        } else {
            setInputtedValue(e.target.value);
        }
    };

    //Function that creates the WFM ticket in the database
    const createTicket = async feature => {
        const ticketObj = createTicketObject(
            feature,
            pickedRule,
            pickedField,
            inputtedValue,
            pickedFeatureType
        );

        console.log("This is where the ticket would be created");
    };

    //Creates the input fields to be shown to the user, calls the buildFields function from the
    //fieldValidatorFunctions.js file
    //buildField receive as parameters:
    //- An array with the radio button objects, containing the value and label of each button
    //- A reference to the function that sets the rule state when the user selects a radio button
    //- The placeholder for the input field containing the name of the feature and the name of the field
    //- A reference to the state that holds the value inputted by the user
    //- A reference to the function that sets the value state when the user types in the input field

    const renderFields = () => {
        switch (ruleType) {
            case 'integer':
            case 'double':
                return (
                    <div>
                        {buildFields(
                            [
                                { value: '<', label: '<' },
                                { value: '>', label: '>' }
                            ],
                            setPickedRule,
                            pickedFeatureType + ' - ' + pickedField,
                            inputtedValue,
                            onValueChange
                        )}
                    </div>
                );
            case 'string':
                return (
                    <div>
                        {buildFields(
                            [
                                { value: 'have', label: msg('have_radio') },
                                { value: 'notHave', label: msg('have_not_radio') }
                            ],
                            setPickedRule,
                            pickedFeatureType + ' - ' + pickedField,
                            inputtedValue,
                            onValueChange
                        )}
                    </div>
                );
            case 'boolean':
                return (
                    <div>
                        {buildFields(
                            [
                                { value: 'true', label: msg('true_radio') },
                                { value: 'false', label: msg('false_radio') }
                            ],
                            setPickedRule
                        )}
                    </div>
                );
        }
    };

    //Function called when the user presses the OK button, it validates the rule for all features
    //within the current map bounds
    const validateRule = async () => {
        setResult([]); //Resets the result state
        let tempResult = [];
        //Queries the database for all the features of the user's picked type that are within
        //the current map bounds
        db.getFeatures(pickedFeatureType, { bounds: appRef.map.getBounds() }).then(result => {
            for (const feature in result) {
                if (result[feature]?.properties) {
                    const props = result[feature].properties;
                    typeof props[pickedField] === 'number' //If the type of the picked field is a number, limit the number of floating point digits to 2
                        ? (props[pickedField] = props[pickedField].toFixed(2))
                        : props[pickedField];
                    //Create the result object containing:
                    //feature: the feature that was validated
                    //result: a boolean with the result of the validation (true or false)
                    const newResult = {
                        feature: result[feature],
                        result: validate(props[pickedField], pickedRule, inputtedValue)
                    };
                    tempResult.push(newResult);
                }
            }
            setResult(tempResult);
        });
    };

    //Builds the list element with the result of the rule validation for each of the features
    const renderResult = () => {
        return (
            <div>
                <br />
                <List
                    size="small"
                    bordered
                    //The list datasource is the result State containing the result objects
                    dataSource={result}
                    header={pickedFeatureType + ' / ' + pickedField + msg('query_result')}
                    renderItem={listItem => (
                        <List.Item>
                            <List.Item.Meta
                                //When click an item on the list the map zooms to the feature and sets it as the current feature
                                onClick={() => {
                                    appRef.map.zoomTo(listItem.feature);
                                    appRef.setCurrentFeature(listItem.feature);
                                }}
                                //Each feature on the list shows a red or green circle depending on the result of the validation
                                avatar={
                                    listItem.result ? (
                                        <Avatar src={greenImg} />
                                    ) : (
                                        <Avatar src={redImg} />
                                    )
                                }
                                title={
                                    listItem.feature.properties.name +
                                    ' - ' +
                                    listItem.feature.properties[pickedField]
                                }
                            />
                            {!listItem.result ? (
                                // If the result valus is false, this means that the feature failed the check, so the "Create WFM ticket" button is shown
                                <Button
                                    type="primary"
                                    onClick={() => createTicket(listItem.feature)}
                                >
                                    {msg('wfm_ticket_button')}
                                </Button>
                            ) : null}
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    return (
        <DraggableModal
            wrapClassName="custom-rules-modal"
            open={isOpen}
            title={msg('windowHeader')} //Localisation key for the title of the modal
            width={500}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button key="ok" onClick={validateRule} type="primary">
                    OK
                </Button>
            ]}
        >
            {/* <Cascader options={featuresList} onChange={onFieldSelected} />
            {renderFields()}
            {true && result.length > 0 ? renderResult() : null} */}
        </DraggableModal>
    );
};
